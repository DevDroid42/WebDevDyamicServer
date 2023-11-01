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

function tableGeneration(list){
    let res = "<table>\n";
    res += "<thead><tr>\n"
    for (const key of Object.keys(list[0])) {
        res += "<th>" + key + "</th>\n"  
    }
    res += "</tr></thead>\n"
    for (let i = 0; i < list.length; i++) {
        const element = list[i];
        res += "<tr>"
        for (const [key, value] of Object.entries(element)) {
            res += "<td>" + value + "</td>\n"  
         }
        res += "</tr>";
    }
    res += "</table>\n";
    return res;
}


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

//this template can be copied for other routes
app.get('/', (req, res) => {
    Promise.all([getTemplate('dynamicTemp1.html'), queryDatabase("SELECT * FROM Urbanization")]).then(values=>{
        res.status(200).type('text').send(values[0] + values[1]);
    }).catch(err => {
        res.status(500).type('text').send("internal server error: \n" + err);
    });
});

//this template can be copied for other routes
app.get('/politicalCorrelationByState/:state', (req, res) => {
    let state = req.params.state.toUpperCase();
    let response = response.replace('$$$STATE_NAME$$$', state);
    Promise.all([getTemplate('politicalCorrelationByState.html'),
    queryDatabase("SELECT * FROM Urbanization WHERE State=?", [state])]).then(values=>{
        res.status(200).type('html').send(values[0].replace("$data$", tableGeneration(values[1])));
    }).catch(err => {
        res.status(500).type('text').send("internal server error: \n" + err);
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});