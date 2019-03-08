webpart

type req = expressRequest
type resp = either<404, future<400, 4xx | 5xx>>
type webpart = (req) => resp

append :: webpart => webpart => webpart

method :: str => webpart
path :: str => webpart
