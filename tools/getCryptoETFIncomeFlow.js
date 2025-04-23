async function getCryptoETFIncomeFlow() {
    const data = await fetch("https://api.sosovalue.xyz/openapi/v2/etf/historicalInflowChart", {
        headers: {
            "x-soso-api-key": "SOSO-8d2d2b86b42b420dbc727cbe6b9627fe",
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({ type: "us-btc-spot" })
    });
    const result = await data.json();
    return JSON.stringify(result.data);
}

export default getCryptoETFIncomeFlow;
