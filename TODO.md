## Interceptors
I like idea of [services preparation](https://github.com/apicase/apicase-services#options-preparation-v02) in apicase-services.  
So we need to go deeper. I'll add this functional to apicase-core but with more features:

### Request interceptor
- Accepts options object
- Invokes before call
- Returns modified options object
- Rejects call on errors in interceptor happened

### Response interceptor
- Accepts responses/errors after call
- Invokes before hooks are called
- Returns modified response
- Changes success/fail state if needed

### Some notes
- All interceptors can be stacked into queues (like hooks)
- Interceptors can be linked with adapters to call only necessary interceptors for different adapters. That adapters will 

## Adapters
Due to interceptors realisation, adapters will now be an object with `handler`, and `interceptors` properties instead of just a function.
It also grants a little more freedom to write custom adapters, high ordered adapters etc.
