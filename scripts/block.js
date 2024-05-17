const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const fs = require('fs');
const now = require('performance-now');
const { parse } = require('json2csv');

const PROTO_PATH = path.join(__dirname, '../protos/block.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

const blockService = protoDescriptor.stordy.block.BlockService;

const client = new blockService('localhost:50051', grpc.credentials.createInsecure());

let blockQt = 10; // Indique a quantidade de blocos a serem inseridos
let arrBlock = [];

let timingData = [];

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
}

// Função para enviar um bloco e realizar as operações subsequentes
async function sendBlock(block) {
    try {
        const startTime = now();
        const addBlockResponse = await new Promise((resolve, reject) => {
            client.AddBlock(block, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    const endTime = now();
                    const timeElapsedInMs = endTime - startTime;
                    timingData.push({
                        AddBlock: timeElapsedInMs,
                        GetLastBlock: null,
                        Length: null
                    });
                    resolve(response);
                }
            });
        });

        const getLastBlockStartTime = now();
        const getLastBlockResponse = await new Promise((resolve, reject) => {
            client.GetLastBlock({}, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    const getLastBlockEndTime = now();
                    const getLastBlockTimeElapsedInMs = getLastBlockEndTime - getLastBlockStartTime;
                    timingData[timingData.length - 1].GetLastBlock = getLastBlockTimeElapsedInMs;
                    resolve(response);
                }
            });
        });

        const lengthStartTime = now();
        const lengthResponse = await new Promise((resolve, reject) => {
            client.Length({}, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    const lengthEndTime = now();
                    const lengthTimeElapsedInMs = lengthEndTime - lengthStartTime;
                    timingData[timingData.length - 1].Length = lengthTimeElapsedInMs;
                    resolve(response);
                }
            });
        });
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// Função para enviar todos os blocos
async function sendAllBlocks() {
    for (const block of arrBlock) {
        await sendBlock(block);
    }
}

sendAllBlocks()
    .then(() => {
        console.log("All blocks have been sent!");
        const csvData = timingData.map(entry => ({
            AddBlock: entry.AddBlock.toFixed(0) + 'ms',
            GetLastBlock: entry.GetLastBlock ? entry.GetLastBlock.toFixed(0) + 'ms' : '',
            Length: entry.Length ? entry.Length.toFixed(0) + 'ms' : ''
        }));

        const csv = parse(csvData, { fields: ['AddBlock', 'GetLastBlock', 'Length'] });

        // Construir o caminho absoluto para salvar o arquivo no diretório desejado
        const filePath = path.join(__dirname, '../formatted_data_block.csv');

        fs.writeFileSync(filePath, csv);
        fs.appendFileSync(filePath, '\n');
        console.log("Formatted timing data written to formatted_data_block.csv");
    })
    .catch(error => console.error("An error has occurred:", error));
