import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';
import { rejects } from 'node:assert';
import { default as Plotly } from 'plotly.js-dist-min';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8000;
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

var usStates = [
    { name: 'al.png', abbreviation: 'AL' },
    { name: 'ak.png', abbreviation: 'AK' },
    { name: 'az.png', abbreviation: 'AZ' },
    { name: 'ar.png', abbreviation: 'AR' },
    { name: 'ca.png', abbreviation: 'CA' },
    { name: 'co.png', abbreviation: 'CO' },
    { name: 'ct.png', abbreviation: 'CT' },
    { name: 'de.png', abbreviation: 'DE' },
    { name: 'fl.png', abbreviation: 'FL' },
    { name: 'ga.png', abbreviation: 'GA' },
    { name: 'hi.png', abbreviation: 'HI' },
    { name: 'ia.png', abbreviation: 'ID' },
    { name: 'il.png', abbreviation: 'IL' },
    { name: 'id.png', abbreviation: 'IN' },
    { name: 'ia.png', abbreviation: 'IA' },
    { name: 'ks.png', abbreviation: 'KS' },
    { name: 'ky.png', abbreviation: 'KY' },
    { name: 'la.png', abbreviation: 'LA' },
    { name: 'me.png', abbreviation: 'ME' },
    { name: 'md.png', abbreviation: 'MD' },
    { name: 'ma.png', abbreviation: 'MA' },
    { name: 'mi.png', abbreviation: 'MI' },
    { name: 'mn.png', abbreviation: 'MN' },
    { name: 'ms.png', abbreviation: 'MS' },
    { name: 'mo.png', abbreviation: 'MO' },
    { name: 'mt.png', abbreviation: 'MT' },
    { name: 'ne.png', abbreviation: 'NE' },
    { name: 'nv.png', abbreviation: 'NV' },
    { name: 'nh.png', abbreviation: 'NH' },
    { name: 'nj.png', abbreviation: 'NJ' },
    { name: 'nm.png', abbreviation: 'NM' },
    { name: 'ny.png', abbreviation: 'NY' },
    { name: 'nc.png', abbreviation: 'NC' },
    { name: 'nd.png', abbreviation: 'ND' },
    { name: 'oh.png', abbreviation: 'OH' },
    { name: 'ok.png', abbreviation: 'OK' },
    { name: 'or.png', abbreviation: 'OR' },
    { name: 'pa.png', abbreviation: 'PA' },
    { name: 'ri.png', abbreviation: 'RI' },
    { name: 'sc.png', abbreviation: 'SC' },
    { name: 'sd.png', abbreviation: 'SD' },
    { name: 'tn.png', abbreviation: 'TN' },
    { name: 'tx.png', abbreviation: 'TX' },
    { name: 'ut.png', abbreviation: 'UT' },
    { name: 'vt.png', abbreviation: 'VT' },
    { name: 'va.png', abbreviation: 'VA' },
    { name: 'wa.png', abbreviation: 'WA' },
    { name: 'wv.png', abbreviation: 'WV' },
    { name: 'wi.png', abbreviation: 'WI' },
    { name: 'wy.png', abbreviation: 'WY' }
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
    if(list.length == 0){
        return "";
    }
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

function barGraphGeneration(list){
    let res = "<script>\n";
    res += "BAR = document.getElementById('bar');\n";
    
    const x_axis_values = [];
    const y_axis_values = [];
    for (let i = 0; i < list.length; i++) {
        x_axis_values.push(list[i]["stcd"]);
        //x_axis_values.push(list[i]["state"] + "-" + list[i]["cd"]);
        y_axis_values.push(list[i]["pvi_22"]);
    }
    console.log(x_axis_values);
    var data = [
        {
            x: x_axis_values,
            y: y_axis_values,
            type: 'bar'
        }
    ];
    res += "Plotly.newPlot('BAR', " + data + ");\n";
    res += "</script>\n";
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
    getTemplate('index.html').then(data=>{
        res.status(200).type('html').send(data);
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
        res.status(200).type('html').send(values[0].replace("$graph$", barGraphGeneration(values[1])));
    }).catch(err => {
        res.status(500).type('text').send("internal server error: \n" + err);
    });
});

//this template can be copied for other routes
app.get('/pviByGrouping/:group', (req, res) => {
    let group = req.params.group;
    Promise.all([getTemplate('pviByGrouping.html'),
    queryDatabase("SELECT pvi_22 FROM Urbanization WHERE grouping=?", [group])]).then(values=>{
        res.status(200).type('html').send(values[0].replace("$data$", tableGeneration(values[1])));
    }).catch(err => {
        res.status(500).type('text').send("internal server error: \n" + err);
    });
});

//this template can be copied for other routes
app.get('/pviGreaterThan', (req, res) => {
    let value = req.query.value;
    if (value == null) value = 0;
    Promise.all([getTemplate('greaterThanLessThan.html'),
    queryDatabase("SELECT * FROM Urbanization WHERE pvi_22>?", [value])]).then(values=>{
        res.status(200).type('html').send(values[0].replace("$data$", tableGeneration(values[1])));
    }).catch(err => {
        res.status(500).type('text').send("internal server error: \n" + err);
    });
});

//this template can be copied for other routes
app.get('/pviLessThan', (req, res) => {
    let value = req.query.value;
    if (value == null) value = 0;
    Promise.all([getTemplate('greaterThanLessThan.html'),
    queryDatabase("SELECT * FROM Urbanization WHERE pvi_22<?", [value])]).then(values=>{
        res.status(200).type('html').send(values[0].replace("$data$", tableGeneration(values[1])));
    }).catch(err => {
        res.status(500).type('text').send("internal server error: \n" + err);
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});