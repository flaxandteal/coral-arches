from django.views.generic import View
from arches.app.utils.response import JSONResponse
from arches.app.models.resource import Resource
from arches_orm.adapter import admin
import uuid


class UserToModel(View):
    def get(self, request):
        user = request.user

        from arches_orm.models import Person, Group

        try:
            with admin():
                person = Person.where(user_account=user.id)
                person = person[0] if len(person) else None 
        except Resource.DoesNotExist:
            person = None

        if not person:
            return JSONResponse(
                {
                    "message": "There is no person modal attached to this user",
                    "person": None,
                }
            )
        
        print("DEBUG: user person", vars(person))
        print("DEBUG: person id", person.id)
        try:
            with admin():
                groups = Group.all()
                for group in groups:
                    print("DEBUG group loop")
                    print("DEBUG id", group.id)
                    print("DEBUG members", list(map(lambda m: m.id, group.members)))
                    if uuid.UUID(person.id) in group.members:
                        print(group.id, person.id, "has the person as a member")
        except:
            pass

        return JSONResponse({"message": "Found users person model", "person": {
            "resource_id": person.id
        }})
