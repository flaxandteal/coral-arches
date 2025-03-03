from django.views.generic import View
from arches.app.utils.response import JSONResponse
from arches.app.models.resource import Resource
from arches_orm.adapter import admin
import uuid


class UserToModel(View):
    def get(self, request):
        user = request.user

        from arches_orm.models import Person, Group
        name = None
        try:
            with admin():
                person = Person.where(user_account=int(user.id))
                person = person[0] if len(person) else None 
                # descriptor was returning as None on arches-orm release/0.2 even though they worked on emerald.
                # name = person._.resource.descriptors['en']['name']
                name = person.name[0].full_name
        except Resource.DoesNotExist:
            person = None

        if not person:
            return JSONResponse(
                {
                    "message": "There is no person modal attached to this user",
                    "person": None,
                }
            )
        
        groupids = []
        try:
            with admin():
                groups = Group.all()
                for group in groups:
                    if str(person.id) in list(map(lambda gm: str(gm.id), group.members)):
                        groupids.append(str(group.id))
        except Exception as e:
            print("DEBUG ERROR", e)

        return JSONResponse({"message": "Found users person model", "person": {
            "resource_id": person.id,
            "name": name,
            "groups": groupids
        }})
