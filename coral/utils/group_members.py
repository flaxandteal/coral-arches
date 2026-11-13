"""Group membership read off tiles, without hydrating the groups or the members."""

from querysets_shim.values import EMPTY, values_by_resource, related_resource_ids


def person_members(group_ids):
    """{person id: full name} for the people in these groups.

    A group can contain other groups, and those have no tile in Person's name
    nodegroup, so asking Person for the name drops them.
    """
    from querysets_shim.models import Group, Person

    if not group_ids:
        return {}

    member_ids = []
    for values in values_by_resource(Group, group_ids, ['members']).values():
        member_ids += related_resource_ids(values.get('members'))

    names = values_by_resource(Person, member_ids, ['full_name'])
    people = {}
    for id in member_ids:
        name = names.get(id, EMPTY).get('full_name')
        if name and id not in people:
            people[id] = name
    return people
