const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const fs = require('fs');
const now = require('performance-now');

const PROTO_PATH = path.join(__dirname, '../protos/transaction.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

const transactionService = protoDescriptor.stordy.transaction.TransactionService;

const client = new transactionService('localhost:50051', grpc.credentials.createInsecure());

let transactionsQt = 10;
let arr = [];

async function processTransactions() {
    for (let i = 0; i <= (transactionsQt*2); i++) {
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
        await sendTransaction(transaction); 
    }
    await saveTransactionsAndCSV(arr);
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
                    // console.log('Tempo para inserir ' + transaction.qtd + " transações: " + elapsedTime.toFixed(0) + 'ms');
                    arr.push(elapsedTime.toFixed(0));

                    const findLastTransactionRequest = { bpk: transaction.bpk };
                    const startFind = now();
                    client.FindLastTransaction(findLastTransactionRequest, (findError, findResponse) => {
                        if (findError) {
                            reject(findError);
                        } else {
                            const endFind = now();
                            const elapsedTimeFind = endFind - startFind;
                            // console.log('Tempo para pesquisar a transação: '+ elapsedTimeFind.toFixed(0) + 'ms');
                            arr.push(elapsedTimeFind.toFixed(0));
                        }
                    });
                }
                resolve(response);
            }
        });
    });
}

async function saveTransactionsAndCSV(arr) {
    const csvContent = arrayToCSV(arr);
    const csvFilePath = path.join('formatted_data_transaction.csv');
    await saveCSVToFile(csvContent, csvFilePath);
    console.log('Transações processadas e CSV salvo.');
}

function arrayToCSV(array) {
    const timePairs = [];
    
    for (let i = 0; i < array.length-1; i += 2) {
        timePairs.push(array.slice(i, i + 2));
    }

    const csvRows = timePairs.map(pair => pair.join(','));
    return csvRows.join('\n');
}

async function saveCSVToFile(csvContent, filePath) {
    let existingContent = '';
    if (fs.existsSync(filePath)) {
        existingContent = fs.readFileSync(filePath, 'utf8');
    }

    const header = "Inserção, Pesquisa\n";
    const newContent = existingContent.length === 0 ? header + csvContent : existingContent + '\n' + header + csvContent;
    fs.writeFileSync(filePath, newContent);
    console.log(`Arquivo CSV atualizado e salvo em: ${filePath}`);
}

processTransactions().catch(error => {
    console.error('Erro ao processar transações:', error);
});
