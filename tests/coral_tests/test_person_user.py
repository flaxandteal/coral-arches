"""Guards person_user, the shared `user_account` resolver the notifications depend on.

Without it `models.UserXNotification(recipient=...)` is handed the bare auth_user pk and
raises `Cannot assign "6": "UserXNotification.recipient" must be a "User" instance`.

Needs a populated database. Run inside the app container:
`docker exec -i coral-arches-1 /web_root/ENV/bin/python manage.py shell -c "exec(open('tests/coral_tests/test_person_user.py').read(), {'__name__': '__main__'})"`
"""

from django.contrib.auth.models import User

from coral.utils.person_user import person_user


class FakePerson:
    def __init__(self, user_account):
        self.user_account = user_account


def a_user():
    return User.objects.order_by('pk').first()


def test_a_bare_pk_resolves_to_the_user():
    # The shape alizarin_django actually hands back, and the reason this exists.
    user = a_user()
    assert person_user(FakePerson(user.pk)) == user
    assert person_user(FakePerson(str(user.pk))) == user


def test_a_user_instance_passes_through():
    user = a_user()
    assert person_user(FakePerson(user)) is user


def test_nothing_to_act_on_is_none():
    assert person_user(None) is None
    assert person_user(FakePerson(None)) is None
    assert person_user(FakePerson('')) is None


def test_an_account_pointing_at_a_deleted_row_is_none():
    # Callers skip the person rather than writing a dangling recipient.
    missing = User.objects.order_by('-pk').first().pk + 1000
    assert person_user(FakePerson(missing)) is None


def test_the_resolved_user_is_assignable_as_a_recipient():
    from arches.app.models import models

    user = person_user(FakePerson(a_user().pk))
    # Unsaved: constructing it is what used to raise ValueError.
    models.UserXNotification(notif=models.Notification(), recipient=user)


if __name__ == '__main__':
    for name, fn in sorted(globals().items()):
        if name.startswith('test_'):
            fn()
    print('ok')
