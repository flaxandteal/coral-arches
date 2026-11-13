import re

from django_hosts import host, patterns

host_patterns = patterns(
    "",
    host(re.sub(r"_", r"-", r"coral"), "coral.urls", name="coral"),
)
