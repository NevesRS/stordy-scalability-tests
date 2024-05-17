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
let arrTransactions = [];

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

async function sendTransaction(transaction) {
    try {
        const startTime = now();
        const addTransactionResponse = await new Promise((resolve, reject) => {
            client.AddTransaction(transaction, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    const endTime = now();
                    const timeElapsedInMs = endTime - startTime;
                    if (transaction.qtd == 1) {
                        timingData.push({ AddTransaction: timeElapsedInMs, FindLastTransaction: null });
                    }
                    resolve(response);
                }
            });
        });

        const findLastTransactionRequest = { bpk: transaction.bpk };
        const findStartTime = now();
        const findLastTransactionResponse = await new Promise((resolve, reject) => {
            client.FindLastTransaction(findLastTransactionRequest, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    const findEndTime = now();
                    const findTimeElapsedInMs = findEndTime - findStartTime;
                    if (transaction.qtd == 1) {
                        timingData[timingData.length - 1].FindLastTransaction = findTimeElapsedInMs;
                    }
                    resolve(response);
                }
            });
        });
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

async function sendAllTransactions() {
    for (const transaction of arrTransactions) {
        await sendTransaction(transaction);
    }
}

sendAllTransactions()
    .then(() => {
        console.log("All transactions have been sent!");

        const csvData = timingData.map(entry => ({
            AddTransaction: entry.AddTransaction.toFixed(0) + 'ms',
            FindLastTransaction: entry.FindLastTransaction ? entry.FindLastTransaction.toFixed(0) + 'ms' : ''
        }));

        const csv = parse(csvData, { fields: ['AddTransaction', 'FindLastTransaction'] });

        fs.writeFileSync('formatted_data_transaction.csv', csv, { flag: 'a' });
        fs.appendFileSync('formatted_data_transaction.csv', '\n');
        console.log("Formatted timing data written to formatted_data_transaction.csv");
    })
    .catch(error => console.error("An error has occurred:", error));
