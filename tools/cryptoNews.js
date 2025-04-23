async function getCryptoNews(pageNum=1, pageSize=10, categoryList="1,2") {
    const data = await fetch(`https://openapi.sosovalue.com/api/v1/news/featured?pageNum=${pageNum}&pageSize=${pageSize}&categoryList=${categoryList}`, {
        headers: {
            "x-soso-api-key": "SOSO-8d2d2b86b42b420dbc727cbe6b9627fe"
        }
    });
    const result = await data.json();

    return JSON.stringify(result.data);
}

export default getCryptoNews;