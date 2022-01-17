# Wordsing

Wordsing is an app which shows you what are the most used words from your favourite artist.

get queue url: http://localhost:9324/?Action=ListQueues

send job sample to queue: curl --location --request POST 'http://localhost:9324/000000000000/sqs-worker-song' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'Action=SendMessage' \
--data-urlencode 'MessageBody={"artistId": 74283}'

curl --location --request POST 'http://localhost:9324/000000000000/sqs-worker-lyrics' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'Action=SendMessage' \
--data-urlencode 'MessageBody={"songId": 2861919, "artistId": 74283}'

elasticMQ UI: http://localhost:9325
