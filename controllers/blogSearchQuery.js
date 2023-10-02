const axios = require("axios")
const _ = require("lodash")

const memoizingTime = (1000 * 60 * 30)

const fetchBlogData = async()=>{
    try {
        let apiResponse = await axios.get("https://intent-kit-16.hasura.app/api/rest/blogs",{
            headers : {
                'x-hasura-admin-secret' : process.env.X_HASURA_ADMIN_SECRET
            }
        })
        const blogData = apiResponse.data.blogs
        
        return blogData

    } catch (error) {
        throw new Error("Error fetching Data")
    }
}

const memoizedFetchBlogData = _.memoize(fetchBlogData, () => Math.floor(Date.now() / memoizingTime));


const search_query = (query, dataToBeSearchedOn) => {
  let searchKeywords = query.split(' ').map((word) => word.toLowerCase());
  let filteredBlogs = [];

  for (let i = 0; i < dataToBeSearchedOn.length; i++) {

    let titleOfBlog = dataToBeSearchedOn[i].title.split(' ').map((word)=>word.toLowerCase());
    let isQueryMatchToTitleWord = false;
    
    for(let j=0;j<titleOfBlog.length;j++){
      
      for(let ind=0;ind<searchKeywords.length;ind++){
        let matchingLength = searchKeywords[ind].length/2;
        let stronglyMatchedLength = 0;
        while(matchingLength<=searchKeywords[ind].length){
          if(titleOfBlog[j].includes(searchKeywords[ind].substr(0,matchingLength))){
              stronglyMatchedLength = matchingLength
          }
          matchingLength++;
        }
        if(stronglyMatchedLength>searchKeywords[ind].length*0.7){            
            isQueryMatchToTitleWord = true;
            break;
        }
      }
      if(isQueryMatchToTitleWord){
        break;
      }
    }
    if (isQueryMatchToTitleWord) {
      filteredBlogs.push(dataToBeSearchedOn[i]);
    }
  }
  return filteredBlogs;
};

const memoizedSearchQuery = _.memoize(
  search_query,
  (query, dataToBeSearchedOn) => {
    const date = new Date();
    return `${query}-${date.getDate()}-${Math.floor(date.getMinutes() / 30)}`;
  }
);
const blogSearch = async (req, res) => {
    try {
    let { query } = req.query;
    let dataToBeSearchedOn = await memoizedFetchBlogData();
    if (!query) {
      return res.status(200).json({ blogs: dataToBeSearchedOn });
    }

    const filteredBlogs = memoizedSearchQuery(query, dataToBeSearchedOn);

    return res.status(200).json({ blogs: filteredBlogs });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};


module.exports = {blogSearch}