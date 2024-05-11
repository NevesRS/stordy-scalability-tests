const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../protos/block.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

const blockService = protoDescriptor.stordy.block.BlockService;

const client = new blockService('localhost:50051', grpc.credentials.createInsecure());


const block = {
    index: 1, 
    previous_hash: "previous_hash",
    timestamp: Date.now(), 
    hash: "hash",
    nonce: 123,
    pbk: "block",
    block_context: "block_context",
    device: "device",
    previous_expired_block_hash: "previous_hash",
    previous_block_signature: "previous_signature"
};

async function sendBlock(block) {
    return new Promise((resolve, reject) => {
        client.AddBlock(block, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
}

async function main() {
    try {
        const response = await sendBlock(block);
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
