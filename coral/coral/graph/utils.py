import re
from functools import partial
import slugify

_SYMBOL_NAMES = {
    "+": "plus",
    "&": "and",
    "-": "dash",
    "@": "at",
    "#": "hash",
    "%": "percent",
    "*": "star",
    "(": "",
    ")": "",
    "?": "q",
    "/": "or",
    "\"": "",
    "'": "",
    ":": " ",
    ";": " ",
    ",": " ",
    "£": "GBP",
    "$": "Dlr", # many common dollar types...
    "€": "EUR",
}

def snake(class_name):
    class_name = class_name[0].lower() + class_name[1:]
    if class_name[0] == "_" and class_name[1].isnumeric():
        class_name = class_name[1:]
    class_name = class_name[0] + re.sub("([a-zA-Z])([A-Z])", r"\1_\2", class_name[1:])
    return class_name.lower()


def string_to_enum(string, full=True):
    if not string:
        return ""
    for sym, word in _SYMBOL_NAMES.items():
        if sym in string:
            string = (f" {word} " if word.strip() else word).join([string_to_enum(w, full=False).strip() for w in string.split(sym)])
    string = string.strip()
    string = slugify.slugify(string.replace(" ", "-")).replace("-", " ")
    if full:
        if len(string) == 1 and string[0].isupper():
            string += "_"
        if string[0].isnumeric():
            string = "_" + string
        string = studly(string)
    return string


def camel(string, studly=False):
    string = ((string[0].upper() if studly else string[0].lower()) + string.replace("_", " ").title()[1:]).replace(" ", "")
    return string
studly = partial(camel, studly=True)
