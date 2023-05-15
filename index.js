import { createDnsResolver } from './dns.js';
import { scheduleTask, updateDnsRecordsExternal } from './schedule.js';

const PORT = parseInt(process.env.PORT, 10) || 5353;
const SOCKET = process.env.SOCKET || '/var/run/docker.sock';
const FORWARDING_DNS = process.env.FORWARDING_DNS || '1.1.1.1';

const dnsRecords = {
    'A': {
        'heathcheck.example.com': '127.0.0.1'
    },
    'CNAME': {
        'heathcheck.example.com': 'example.com.',
    }
};

// run once on start
updateDnsRecordsExternal(dnsRecords, SOCKET);

const dnsResolver = createDnsResolver(dnsRecords, FORWARDING_DNS);

dnsResolver.bind(PORT);

scheduleTask(dnsRecords, SOCKET);

async function shutdown() {
    console.log("Caught interrupt signal");
    process.exit();
}

// Attach the shutdown function to SIGINT and SIGTERM signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
