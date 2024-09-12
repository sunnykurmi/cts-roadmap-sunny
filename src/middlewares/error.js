exports.generatedErrors=async(err,req,res,next)=>{

    let statusCode = err.statusCode || 500;

    if(err.name ==="mongoServerError" && err.message.includes("E11000 duplicate key")){
        err.message = "User with this email or contact already exists"
    }
    
    res.status(statusCode).json({
        success:false,
        message:err.message,
        errorName:err.name,
        stack:err.stack
    })
}