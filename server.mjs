import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';
import { rejects } from 'node:assert';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8000;
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

const db = new sqlite3.Database(path.join(__dirname, 'urbanization.sqlite3'), sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error connecting to database');
    }
    else {
        console.log('Successfully connected to database');
    }
});


function queryDatabase(query, params){
    return new Promise((Resolve, Reject) =>{
        db.all(query, params, (err, rows) =>{
            if(err){
                Reject(err);
            }else{
                Resolve(rows);
            }
        });
    });
}

function getTemplate(templateFile){
    return new Promise((Resolve, Reject) =>{
        fs.readFile(path.join(template, templateFile), 'utf-8', (err, data) => {
            if(err){
                Reject(err);
            }else{
                Resolve(data);
            }
        });
    });
}

let app = express();
app.use(express.static(root));

app.get('/', (req, res) => {
    Promise.all([getTemplate('dynamicTemp1.html'), queryDatabase("SELECT * FROM Urbanization")]).then(values=>{
        res.status(200).type('text').send(values[0] + values[1]);
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});