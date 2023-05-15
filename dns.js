import dgram from 'dgram';
import dnsPacket from 'dns-packet';

function logDnsInfo(query, response, respType) {
    console.log(`${respType} - Query: ${JSON.stringify(query.questions)}, Answer: ${JSON.stringify(response.answers)}`);
}

export function createDnsResolver(dnsRecords, forwardingDns) {
    const server = dgram.createSocket('udp4');

    server.on('message', (msg, remote) => {
        const query = dnsPacket.decode(msg);
        const { type, name } = query.questions[0];

        const dnsRecord = dnsRecords[type] && dnsRecords[type][name];

        if (dnsRecord) {
            const response = {
                type: 'response',
                id: query.id,
                questions: query.questions,
                answers: [{
                    type: type,
                    name: name,
                    ttl: 300,
                    class: 'IN',
                    data: dnsRecords[type][name],
                }],
            };

            logDnsInfo(query, response, "Local");

            server.send(dnsPacket.encode(response), remote.port, remote.address);
        } else {
            // Forwarding to other DNS servers
            const client = dgram.createSocket('udp4');

            client.on('message', (message) => {
                const responseFromUpstream = dnsPacket.decode(message);

                logDnsInfo(query, responseFromUpstream, "Remote");

                server.send(message, remote.port, remote.address);
                client.close();
            });

            client.send(msg, 53, forwardingDns, (err) => {
                if (err) {
                    console.error(err);
                    client.close();
                }
            });
        }
    });

    return server;
}
