const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const now = require('performance-now');

const PROTO_PATH = path.join(__dirname, '../protos/transaction.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

const transactionService = protoDescriptor.stordy.transaction.TransactionService;

const client = new transactionService('localhost:50051', grpc.credentials.createInsecure());

let qtdTransacoes = 20; //Indique a quantidade de transações a serem inseridas
let contador = 0;
let arrTransactions = [];

for (let i = 0; i < qtdTransacoes+1; i++) {
    const qtd = (i % 2 === 0) ? 1 : 499999;
    const transaction = {
        bpk: "block", 
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
console.log("Time taken to insert each transaction into a block")
async function sendTransaction(transaction) {
    return new Promise((resolve, reject) => {
        const startTime = now(); 
        client.AddTransaction(transaction, (error, response) => {
            if (error) {
                reject(error);
            } else {
                const endTime = now(); 
                const timeElapsedInMs = endTime - startTime;
                if (contador % 2 == 0) {
                    console.log(timeElapsedInMs.toFixed(0)+"ms"); 
                }
                resolve(response);
            }
            contador++;
        });
    });
}

async function sendAllTransactions() {
    for (const transaction of arrTransactions) {
        await sendTransaction(transaction);
    }
}

sendAllTransactions()
    .then(() => console.log("Todas as transações foram enviadas com sucesso!"))
    .catch(error => console.error("Ocorreu um erro ao enviar as transações:", error));
