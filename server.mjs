import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const port = 8000;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

let app = express();
app.use(express.static(root));

const db = new sqlite3.Database(path.join(__dirname, 'urbanization.sqlite3'), sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error connecting to database');
    }
    else {
        console.log('Successfully connected to database');
    }
});

app.get('/mfr/:name', (req, res) => {
    let manufacturer = req.params.name;
    console.log(manufacturer);

    let data1 = null;
    let data2 = null;
    let finishAndSend = function() {
        fs.readFile(path.join(template, 'mfr.html'), 'utf-8', (err, data) => {
            let response = data.replace('$$MFR_NAME$$', data2.name);
            let table_body = '';
            data1.forEach((cereal) => {
                let table_row = '<tr>';
                table_row += '<td>' + cereal.name + '</td>';
                table_row += '<td>' + cereal.type + '</td>';
                table_row += '<td>' + cereal.calories + '</td>';
                table_row += '<td>' + cereal.fat + '</td>';
                table_row += '<td>' + cereal.protein + '</td>';
                table_row += '<td>' + cereal.carbohydrates + '</td>';
                table_row += '</tr>\n';
                table_body += table_row;
            });
            response = response.replace('$$TABLE_BODY$$', table_body);
            res.status(200).type('html').send(response);
        });
    };

    let query1 = 'SELECT * FROM Cereals WHERE mfr = ?';
    db.all(query1, [manufacturer.toUpperCase()], (err, rows) => {
        if (err) {
            console.log(err);
        }
        else {
            data1 = rows;
            if (data1 !== null && data2 !== null) {
                finishAndSend();
            }
        }
    });
    let query2 = 'SELECT * FROM Manufacturers WHERE id = ?';
    db.get(query2, [manufacturer.toUpperCase()], (err, row) => {
        if (err) {
            console.log(err);
        }
        else {
            data2 = row;
            if (data1 !== null && data2 !== null) {
                finishAndSend();
            }
        }
    });

    // let num2 = parseInt(req.params.num2);
    // let answer = num1 + num2;
    // fs.readFile(path.join(template, 'add.html'), 'utf-8', (err, data) => {
    //     let response = data.replace('$$EQUATION$$', num1 + ' + ' + num2 + ' = ' + answer);
    //     res.status(200).type('html').send(response);
    // });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
