# FakeDNS

FakeDNS is a custom Node.js project that functions as a DNS server, forwarding DNS queries to an external DNS server. However, it uniquely intercepts and returns custom DNS records based on specific domain names, which it dynamically reads from Docker compose labels.

**Warning**: This software is not designed to be used as a public-facing DNS server. It should be used inside a secure environment, such as a private network, VPN, or secure overlay network like Tailscale. Use in an insecure, public-facing environment can lead to security vulnerabilities and potential misuse.

## Usage

Once the server is running, it will start listening for DNS queries on the specified address and port. It will also schedule a task to update DNS records based on Docker container labels.

If a Docker container has a label with the key fakedns.dns.<unique_identifier> and a value in the format <domain> <record_type> <ip_address>, the server will add a DNS record for it.

## Docker Integration / Lables

The DNS resolver can automatically update its DNS records based on Docker container labels. To use this feature, add labels to your Docker containers with the following format:

```
fakedns.dns.<unique_identifier>=<domain> <record_type> <ip_address>
```

For example:

```
fakedns.dns.myapp=example.com A 192.168.1.10
fakedns.dns.vault=vault.example.com A 100.127.46.189
```

## Usage

### Configuration

You can configure the application using environment variables:

- `PORT`: The port on which the DNS resolver will listen (default: `5353`)
- `SOCKET`: The Docker socket path (default: `/var/run/docker.sock`)
- `FORWARDING_DNS`: The external DNS server to forward queries (default: `1.1.1.1`)

### docker-compose.yml (recommended)

```
version: "3.7"

services:
  fakedns:
    container_name: fakedns
    image: ghcr.io/atatka/fakedns
    restart: unless-stopped
    ports:
       - 100.127.46.189:53:5353/udp # dns
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - TZ=Europe/Vienna
```

### docker cli

```
docker run --name fakedns -v /var/run/docker.sock:/var/run/docker.sock -p 100.127.46.189:53:5353/udp -d ghcr.io/atatka/fakedns
```

## Acknowledgments

- OpenAI's GPT-4 model for code generation and optimization
