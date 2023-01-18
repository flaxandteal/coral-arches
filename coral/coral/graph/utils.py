import re
import slugify

def _convert(class_name):
    class_name = class_name[0].lower() + class_name[1:]
    class_name = re.sub("([A-Z])", r"_\1", class_name)
    return class_name.lower()


def string_to_enum(string):
    return slugify.slugify(string.replace(" ", "-")).replace("-", " ").title().replace(" ", "")

