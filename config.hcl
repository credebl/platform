storage "file" {
  path = "/bao/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1 # In true production, configure actual TLS certificates here
}

ui = true
