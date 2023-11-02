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

var usStates = [
    { name: 'Alabama', abbreviation: 'AL' },
    { name: 'Alaska', abbreviation: 'AK' },
    { name: 'Arizona', abbreviation: 'AZ' },
    { name: 'Arkansas', abbreviation: 'AR' },
    { name: 'California', abbreviation: 'CA' },
    { name: 'Colorado', abbreviation: 'CO' },
    { name: 'Connecticut', abbreviation: 'CT' },
    { name: 'Delaware', abbreviation: 'DE' },
    { name: 'Florida', abbreviation: 'FL' },
    { name: 'Georgia', abbreviation: 'GA' },
    { name: 'Hawaii', abbreviation: 'HI' },
    { name: 'Idaho', abbreviation: 'ID' },
    { name: 'Illinois', abbreviation: 'IL' },
    { name: 'Indiana', abbreviation: 'IN' },
    { name: 'Iowa', abbreviation: 'IA' },
    { name: 'Kansas', abbreviation: 'KS' },
    { name: 'Kentucky', abbreviation: 'KY' },
    { name: 'Louisiana', abbreviation: 'LA' },
    { name: 'Maine', abbreviation: 'ME' },
    { name: 'Maryland', abbreviation: 'MD' },
    { name: 'Massachusetts', abbreviation: 'MA' },
    { name: 'Michigan', abbreviation: 'MI' },
    { name: 'Minnesota', abbreviation: 'MN' },
    { name: 'Mississippi', abbreviation: 'MS' },
    { name: 'Missouri', abbreviation: 'MO' },
    { name: 'Montana', abbreviation: 'MT' },
    { name: 'Nebraska', abbreviation: 'NE' },
    { name: 'Nevada', abbreviation: 'NV' },
    { name: 'New Hampshire', abbreviation: 'NH' },
    { name: 'New Jersey', abbreviation: 'NJ' },
    { name: 'New Mexico', abbreviation: 'NM' },
    { name: 'New York', abbreviation: 'NY' },
    { name: 'North Carolina', abbreviation: 'NC' },
    { name: 'North Dakota', abbreviation: 'ND' },
    { name: 'Ohio', abbreviation: 'OH' },
    { name: 'Oklahoma', abbreviation: 'OK' },
    { name: 'Oregon', abbreviation: 'OR' },
    { name: 'Pennsylvania', abbreviation: 'PA' },
    { name: 'Rhode Island', abbreviation: 'RI' },
    { name: 'South Carolina', abbreviation: 'SC' },
    { name: 'South Dakota', abbreviation: 'SD' },
    { name: 'Tennessee', abbreviation: 'TN' },
    { name: 'Texas', abbreviation: 'TX' },
    { name: 'Utah', abbreviation: 'UT' },
    { name: 'Vermont', abbreviation: 'VT' },
    { name: 'Virginia', abbreviation: 'VA' },
    { name: 'Washington', abbreviation: 'WA' },
    { name: 'West Virginia', abbreviation: 'WV' },
    { name: 'Wisconsin', abbreviation: 'WI' },
    { name: 'Wyoming', abbreviation: 'WY' }
  ];  


  //for abbr in listofusstates:
  //  match abbrYourLoookingFor with AbbrInUSStatesList:
    //    When MatchIsFound:
      //      Access like so: usStates[abbr].name = stateName
  //fileName = "Flag_of_" + stateName + ".svg"

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
    Promise.all([getTemplate('politicalCorrelationByState.html'),
    queryDatabase("SELECT * FROM Urbanization WHERE State=?", [state])]).then(values=>{
        console.log(values[0].replace("$data$", tableGeneration(values[1])));
        res.status(200).type('html').send(values[0].replace("$data$", tableGeneration(values[1])));
    }).catch(err => {
        res.status(500).type('text').send("internal server error: \n" + err);
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});