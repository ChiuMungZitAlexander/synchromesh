# sse-sync

An [SSE(server-sent event)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) based pub-sub lib aiming for data subscription, differing, and synchronization between client and server side.

Register the data source, and sse-sync will automatically diff the lastest data with current data from the source and then push the data to the client side if there're any changes.

This lib is very useful when your client side needs to render the external data that change rapidly. See the example for the details.
