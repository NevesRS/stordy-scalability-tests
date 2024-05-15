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

async function processTransactions() {
    for (let i = 0; i < transactionsQt; i++) {
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
        await sendTransaction(transaction); // Aguarda a conclusão da transação atual antes de prosseguir
    }
}

async function sendTransaction(transaction) {
    return new Promise((resolve, reject) => {
        const start = now();
        client.AddTransaction(transaction, (error, response) => {
            if (error) {
                reject(error);
            } else {
                if (transaction.qtd == 1) {
                    const end = now();
                    const elapsedTime = end - start;
                    console.log('Tempo para inserir ' + transaction.qtd + " transações: " + elapsedTime.toFixed(0) + 'ms');

                    const findLastTransactionRequest = { bpk: transaction.bpk };
                    const startFind = now();
                    client.FindLastTransaction(findLastTransactionRequest, (findError, findResponse) => {
                        if (findError) {
                            reject(findError);
                        } else {
                            const endFind = now();
                            const elapsedTimeFind = endFind - startFind;
                            console.log('Tempo para pesquisar a transação: ' + elapsedTimeFind.toFixed(0) + 'ms');
                        }
                    });
                }
                resolve(response);
            }
        });
    });
}

processTransactions().catch(error => {
    console.error('Erro ao processar transações:', error);
});

