import re
from functools import partial
import slugify

def snake(class_name):
    class_name = class_name[0].lower() + class_name[1:]
    class_name = re.sub("([A-Z])", r"_\1", class_name)
    return class_name.lower()


def string_to_enum(string):
    string = string.replace("& ", "and ")
    if "/" in string:
        return "".join(map(string_to_enum, string.split("/")))
    return slugify.slugify(string.replace(" ", "-")).replace("-", " ").title().replace(" ", "")


def camel(string, studly=False):
    string = ((string[0].upper() if studly else string[0].lower()) + string.replace("_", " ").title()[1:]).replace(" ", "")
    if string[-1] != string[-1].lower():
        string += "_"
    return string
studly = partial(camel, studly=True)
