

# Collection

## Users
- email
- password
- firstName
- lastName
- roles
- budget
- currency
- timezone
- avatar


## House holds
- name
- owner (relation to Users)
- members (relation to Members)

## Members
- name
- avatar
- budget limit


## Categories
- name
- isPublic
- color
- owner (relation to Users)

## Subscriptions
- name
- category
- website url
- logo
- amount
- currency
- billing cycle
- frequency
- promo price
- promo end date
- start date
- next billing date
- free trial end date
- auto renew
- notes
- tags
- description
- reminder date
- owner (relation to Users)
- house hold (relation to House holds)
- member share (array of objects with member relation and share percentage)
- 
## Notifications
- subscription (relation to Subscriptions)
- user (relation to Users)
- notification date
- sent (boolean)
- method (email, sms, push)
- message
