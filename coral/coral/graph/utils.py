import re
from functools import partial
import slugify

def snake(class_name):
    class_name = class_name[0].lower() + class_name[1:]
    if class_name[0] == "_" and class_name[1].isnumeric():
        class_name = class_name[1:]
    class_name = class_name[0] + re.sub("([a-zA-Z])([A-Z])", r"\1_\2", class_name[1:])
    return class_name.lower()


def string_to_enum(string):
    string = string.replace("& ", "and ")
    if "/" in string:
        return "".join(map(string_to_enum, string.split("/")))
    return studly(slugify.slugify(string.replace(" ", "-")).replace("-", " "))


def camel(string, studly=False):
    string = ((string[0].upper() if studly else string[0].lower()) + string.replace("_", " ").title()[1:]).replace(" ", "")
    if string[-1] != string[-1].lower():
        string += "_"
    if string[0].isnumeric():
        string = "_" + string
    return string
studly = partial(camel, studly=True)
