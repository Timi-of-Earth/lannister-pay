const express = require('express');
const app = express();


app.use(express.json());

app.get('/', (req, res) => {
    res.send('Compute')
})

app.post('/split-payments/compute', (req, res) => {
    const transaction = req.body;
    
    if (transaction.SplitInfo.length > 20 || transaction.SplitInfo.length < 1 ) {
        return res.status(400).send('Bad request');
    }

    let flats = [];
    let percentages = [];
    let ratios = [];
    let ratioSum = 0;

    transaction.SplitInfo.forEach((entity) => {
        if (entity.SplitValue < 0) {
            return res.status(400).send('Bad request');
        }
        if (entity.SplitType === "FLAT") {
            flats.push(entity)
        } else if (entity.SplitType === "PERCENTAGE") {
            percentages.push(entity)
        } else if (entity.SplitType === "RATIO") {
            ratioSum += entity.SplitValue;
            ratios.push(entity)
        }
    });

    let response = {
        ID: transaction.ID,
        Balance: transaction.Amount,
        SplitBreakdown: []
    };

    flats.forEach((entry) => {
        let entryResponse = {
            SplitEntityId: entry.SplitEntityId,
            Amount: entry.SplitValue
        };
        response.SplitBreakdown.push(entryResponse);
        response.Balance -= entryResponse.Amount;
        if (response.Balance < 0) {
            return res.status(400).send('Bad request');
        };     
    });

    percentages.forEach((entry) => {
        let entryResponse = {
            SplitEntityId: entry.SplitEntityId,
            Amount: (entry.SplitValue * response.Balance) / 100
        };
        response.SplitBreakdown.push(entryResponse);
        response.Balance -= entryResponse.Amount;
        if (response.Balance < 0) {
            return res.status(400).send('Bad request');
        }       
    });

    let ratioBalance = response.Balance;
    ratios.forEach((entry) => {
        let entryResponse = {
            SplitEntityId: entry.SplitEntityId,
            Amount: (entry.SplitValue * ratioBalance) / ratioSum,
          };
          response.SplitBreakdown.push(entryResponse);
          response.Balance -= entryResponse.Amount;
          if (response.Balance < 0) {
            return res.status(400).send('Bad request');
        }       
    });

    res.status(200).send(response);


});


const port = process.env.PORT || 3000;

const start = () => {app.listen(port, () =>
console.log(`Server is listening on port ${port}...`)
);}

start();