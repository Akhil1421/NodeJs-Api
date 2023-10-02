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
        const blogNumber = _.size(blogData)
        const blogsWithLongestTitles = _.maxBy(blogData, object => object.title.length)
        const numberOfBlogsWithGivenWord = _.filter(blogData, object => _.includes(_.toLower(object.title), 'privacy')).length
        const uniqueTitles = _.uniq(_.map(blogData, 'title'), 'title')
            
        let finalBlogData = {
            blogNumber,
            blogsWithLongestTitles,
            numberOfBlogsWithGivenWord,
            uniqueTitles
        }
            
        return finalBlogData

    } catch (error) {
        throw new Error(error.message)
    }
}

const memoizedFetchBlogData = _.memoize(fetchBlogData, () => Math.floor(Date.now() / memoizingTime));

const getStats = async(req,res)=>{
    try {
        let finalBlogData = await memoizedFetchBlogData()    
        return res.status(200).json({blogAnalysis : finalBlogData})
    } catch (error) {
        return res.status(500).json({msg: error.message})
    }
}


module.exports = {getStats}