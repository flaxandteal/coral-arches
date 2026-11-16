"""Resolve a Person resource to the auth User its `user_account` names."""

from django.contrib.auth.models import User


def person_user(person):
    """The User behind a Person, or None if there is none to act on.

    `user_account` is a `user` datatype node, which alizarin_django leaves unwrapped, so
    tiledata hands back the bare auth_user pk rather than a User. An account pointing at
    a deleted row resolves to None as well, so callers skip the person instead of handing
    a pk to something that wants an instance.
    """
    if person is None:
        return None
    account = person.user_account
    if not account:
        return None
    if hasattr(account, "pk"):
        return account
    return User.objects.filter(pk=account).first()
