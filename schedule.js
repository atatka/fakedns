import Docker from 'dockerode';
import cron from 'node-cron';
import fs from 'fs';

async function inspectContainer(docker, containerId) {
    return new Promise((resolve, reject) => {
        docker.getContainer(containerId).inspect((err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

async function listContainers(docker) {
    return new Promise((resolve, reject) => {
        docker.listContainers((err, containers) => {
            if (err) reject(err);
            else resolve(containers);
        });
    });
}

async function writeDnsRecordsToFile(dnsRecords) {
    try {
        await fs.promises.writeFile('/tmp/dnsRecords.json', JSON.stringify(dnsRecords, null, 2));
    } catch (error) {
        console.error(`Failed to write DNS records to file: ${error.message}`);
    }
}

async function updateDnsRecords(docker, dnsRecords) {
    const containers = await listContainers(docker);

    for (const container of containers) {
        const data = await inspectContainer(docker, container.Id);
        const labels = data.Config.Labels;

        for (const label in labels) {
            if (label.startsWith('fakedns.dns.')) {
                const dnsEntry = labels[label];
                const parts = dnsEntry.trim().split(/\s+/);

                if (parts.length !== 3) {
                    console.error('Invalid input string');
                    continue;
                }

                const [name, type, address] = parts;
                if (type === 'A') {
                    if (!dnsRecords[type][name]) {
                        console.log(`New DNS Entry: ${name}, Type: ${type}, Address: ${address}`);
                        dnsRecords[type][name] = address;
                    } else if (dnsRecords[type][name] !== address) {
                        console.log(`DNS Entry for ${name}, Type: ${type} already exists with a different address. Current: ${dnsRecords[type][name]}, New: ${address}`);
                        dnsRecords[type][name] = address;
                    }
                    //else {
                    //    console.log(`DNS Entry for ${name}, Type: ${type} already exists with the same address. No action needed.`);
                    //}
                } else {
                    console.log("Only A records for IP addresses are currently supported.")
                }
            }
        }
    }
}


export function scheduleTask(dnsRecords, SOCKET) {
    const docker = new Docker({ socketPath: SOCKET });

    cron.schedule('* * * * *', async () => {
        try {
            await docker.ping();
            //console.log('Successfully connected to Docker socket');
            await updateDnsRecords(docker, dnsRecords);
            await writeDnsRecordsToFile(dnsRecords);
        } catch (error) {
            console.error(error.message);
        }
    });
}

export async function updateDnsRecordsExternal(dnsRecords, SOCKET) {
    const docker = new Docker({ socketPath: SOCKET });

    try {
        await docker.ping();
        //console.log('Successfully connected to Docker socket');
        await updateDnsRecords(docker, dnsRecords);
    } catch (error) {
        console.error(error.message);
    }
}

