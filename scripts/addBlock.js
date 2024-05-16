const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const now = require('performance-now');

const PROTO_PATH = path.join(__dirname, '../protos/block.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

const blockService = protoDescriptor.stordy.block.BlockService;

const client = new blockService('localhost:50051', grpc.credentials.createInsecure());

let blockQt = 10; //Indique a quantidade de blocos a serem inseridos
let arrBlock = [];

for (let i = 0; i < blockQt + 1; i++) {
    const block = {
        index: i,
        previous_hash: "prev" + i,
        timestamp: 123 + i,
        hash: "123" + i,
        nonce: 1234 + i,
        pbk: "block" + i,
        block_context: "block data" + i,
        device: "device" + i,
        previous_expired_block_hash: "prev expired hash" + i,
        previous_block_signature: "prev block signature" + i
    };

    arrBlock.push(block);
};

let bool = false;
// console.log("Time taken to insert 1 new block")
async function sendBlock(block) {
    return new Promise((resolve, reject) => {
        const startTime = now();
        client.AddBlock(block, (error, response) => {
            if (error) {
                reject(error);
            } else {
                bool = true;
                const endTime = now();
                const timeElapsedInMs = endTime - startTime;
                // console.log('Tempo para inserir bloco:', timeElapsedInMs.toFixed(0) + 'ms');
                resolve(response);
            }
        });

        if (bool) {
            const getLastBlockStartTime = now();
            client.GetLastBlock({}, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    const endTime = now();
                    const timeElapsedInMs = endTime - getLastBlockStartTime;
                    // console.log('Tempo para buscar o último bloco inserido:', timeElapsedInMs.toFixed(0) + 'ms');
                    resolve(response);
                }
            });
        }
    });
}


async function sendAllBlocks() {
    for (const block of arrBlock) {
        await sendBlock(block);
    }
}

sendAllBlocks()
    .then(() => console.log("All blocks has been sent!"))
    .catch(error => console.error("An error has ocurred:", error));
