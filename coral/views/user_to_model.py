from django.views.generic import View
from arches.app.utils.response import JSONResponse
from arches.app.models.resource import Resource
from arches_orm.adapter import admin


class UserToModel(View):
    def get(self, request):
        user = request.user

        from arches_orm.models import Person

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

        return JSONResponse({"message": "Found users person model", "person": {
            "name": person.full_name,
            "resource_id": person.id
        }})
