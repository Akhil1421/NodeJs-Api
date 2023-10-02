const axios = require("axios")
const _ = require("lodash")

const memoizingTime = (1000 * 60 * 30)

//function to fetch the blog data whenever a req is made on the endpoint and cached valid time has passed
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

//memoize or cache the fetchBlogData so that api call happens only after memoizingTime which is 30 minutes for now
const memoizedFetchBlogData = _.memoize(fetchBlogData, () => Math.floor(Date.now() / memoizingTime));

//the function to filter the data from api according to the query
//for each word in the title of a blog it searches the query word from half length to full length and 
//if matched length > half length of the query then that blog is added to result
//each blog is given priority on the basis of longest matched length and hence are sorted according to that priority
// And finally result is provided
const search_query = (query, dataToBeSearchedOn) => {
  let searchKeywords = query.split(' ').map((word) => word.toLowerCase());
  let filteredBlogs = [];
  let matching_percentage_lookup_table = {}
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
        if(stronglyMatchedLength>searchKeywords[ind].length*0.5){            
            isQueryMatchToTitleWord = true;
            matching_percentage_lookup_table[dataToBeSearchedOn[i].id] = stronglyMatchedLength/searchKeywords[ind].length * 100
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
  filteredBlogs.sort((a,b)=>{
    return matching_percentage_lookup_table[b.id] - matching_percentage_lookup_table[a.id];
  })
  return filteredBlogs;
};

//memoize each query result for 30 minutes
const memoizedSearchQuery = _.memoize(
  search_query,
  (query, dataToBeSearchedOn) => {
    const date = new Date();
    return `${query}-${date.getDate()}-${Math.floor(date.getMinutes() / 30)}`;
  }
)

//controller to serve the results for a req query
const blogSearch = async (req, res) => {
    try {
    let { query } = req.query;
    if (!query) {
      return res.status(400).json({ msg : "No query parameter provided" });
    }
    let dataToBeSearchedOn = await memoizedFetchBlogData();
    const filteredBlogs = memoizedSearchQuery(query, dataToBeSearchedOn);
    return res.status(200).json({ blogs: filteredBlogs });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};


module.exports = {blogSearch}