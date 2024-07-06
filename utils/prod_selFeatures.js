class Apifeature{
    constructor(query,str){
        this.query=query;
        this.str = str;

    }

    searchFunc(){
        const keyword = this.str.keyword ?{
            name:{
                // to search from keyword in  the queries in the url 
                $regex: this.str.keyword,
                $options:"i",
            },
        }
        :{} ;

        this.query = this.query.find({...keyword});

        return this;
    }

    filterFunc(){
        const qCopy = {...this.str};
        // filter only on basis of query category 
        const unwantedFields= ["keyword" , "limit","page"];
        unwantedFields.forEach((key)=> delete qCopy[key]);

        // filter on basis of price and rating 
        let qstr = JSON.stringify(qCopy);
        qstr = qstr.replace(/\b(gt|gte|lt|lte)\b/g, (key)=>`$${key}`) ;
        // adding $ before gt,lt to make it a mongoose operator 
        this.query = this.query.find(JSON.parse(qstr));

        return this;
    }

    paginationFunc(perPageCnt){
        const currPage = Number(this.str.page) || 1;
        const skipRes = perPageCnt*(currPage-1);
        this.query = this.query.limit(perPageCnt).skip(skipRes);
        return this;
    }

}

module.exports = Apifeature;