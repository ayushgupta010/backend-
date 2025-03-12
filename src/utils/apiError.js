class ApiError extends Error{
    constructor(
        message, 
        statusCode,
        errors={},
        statck=""
    ){
        super(message)
        this.statusCode=statusCode
        this.errors = errors
        this.data=null
        this.success = false   
        this.message= message  

        if(stack){
            this.stack = stack  
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export default ApiError;