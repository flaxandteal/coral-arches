from revproxy.views import ProxyView

class ExtradosProxyView(ProxyView):
    upstream = 'http://extrados:80'