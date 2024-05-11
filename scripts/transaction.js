const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const fs = require('fs');
const now = require('performance-now');
const { parse } = require('json2csv');

const PROTO_PATH = path.join(__dirname, '../protos/transaction.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

const transactionService = protoDescriptor.stordy.transaction.TransactionService;

const client = new transactionService('localhost:50051', grpc.credentials.createInsecure());

let transactionsQt = 10; //Indique a quantidade de transações a serem inseridas após 499.999
let counterAdd = 0;
let counterFind = 0;
let arrTransactions = [];

// Array para armazenar os tempos de inserção e busca
let timingData = [];

for (let i = 0; i < (transactionsQt * 2) + 1; i++) {
    const qtd = (i % 2 === 0) ? 1 : 499999;
    const transaction = {
        bpk: "block0",
        qtd: qtd,
        transaction: {
            data: "non" + i,
            hash: "nostrud nisi" + i,
            identification: "Lorem consectetur magna Excepteur et" + i,
            index: 3489093785 + i,
            nonce: 948774202 + i,
            previousHash: "in" + i,
            signature: "nisi" + i,
            timestamp: "41380415" + i
        }
    };
    arrTransactions.push(transaction);
}

// console.log("Time taken to insert 1 transaction after 499.999 inserted into a block")

async function sendTransaction(transaction) {
    return new Promise((resolve, reject) => {
        const startTime = now();
        client.AddTransaction(transaction, (error, response) => {
            if (error) {
                reject(error);
            } else {
                if (counterAdd % 2 == 0) {
                    const endTime = now();
                    const timeElapsedInMs = endTime - startTime;
                    timingData.push({ AddTransaction: timeElapsedInMs, FindLastTransaction: null });
                }
                counterAdd++;

                const findLastTransactionRequest = { bpk: transaction.bpk };
                const findStartTime = now();
                client.FindLastTransaction(findLastTransactionRequest, (findError, findResponse) => {
                    if (findError) {
                        reject(findError);
                    } else {
                        if (counterFind % 2 == 0) {
                            const findEndTime = now();
                            const findTimeElapsedInMs = findEndTime - findStartTime;
                            timingData[timingData.length - 1].FindLastTransaction = findTimeElapsedInMs;
                        }
                        counterFind++;
                        resolve(response);
                    }
                });
            }
        });
    });
}

async function sendAllTransactions() {
    for (const transaction of arrTransactions) {
        await sendTransaction(transaction);
    }
}

sendAllTransactions()
    .then(() => {
        console.log("All transactions have been sent!");
        // Preparar os dados para escrita no arquivo CSV
        const csvData = timingData.map(entry => ({
            AddTransaction: entry.AddTransaction.toFixed(0) + 'ms',
            FindLastTransaction: entry.FindLastTransaction ? entry.FindLastTransaction.toFixed(0) + 'ms' : ''
        }));

        // Converter os dados para formato CSV
        const csv = parse(csvData, { fields: ['AddTransaction', 'FindLastTransaction'] });

        // Escrever os dados no arquivo
        fs.writeFileSync('formatted_data_transaction.csv', csv, { flag: 'a' });
        fs.appendFileSync('formatted_data_transaction.csv', '\n');
        console.log("Formatted timing data written to formatted_data_transaction");
    })
    .catch(error => console.error("An error has occurred:", error));