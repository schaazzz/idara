import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

Meteor.methods({
    'users.insert'(username, password, isRoot) {
        check(username, String);
        check(password, String);
        check(isRoot, Boolean);

        if(Meteor.users.find({}).count() != 0 || !Meteor.users.isRoot) {
            return false;
        }

        console.log(Meteor.users.find({}).count());
        console.log('Server: Adding user (root: %s) %s:%s', isRoot, username, password);
    },
    'users.list'() {
        return 'user list';
    }
});

if (Meteor.isServer) {
    Accounts.validateLoginAttempt(function (info) {
        console.log('===========> Accounts.validateLoginAttempt()');
        console.log(info);
        var result = false;

        if(info.user) {
            result = !info.user.profile.disableLogin;
            var newProfile = info.user.profile;
            newProfile.disableLogin = false;
            Meteor.users.update({'username': info.user.username}, {$set: {profile: newProfile} });
        }
        return result;
    });

    Accounts.onCreateUser(function (options, user) {
        console.log('===========> Accounts.onCreateUser()');
        user.profile = options.profile;
        user.profile.disableLogin = true;
        console.log(user);
        return user;
    });

    Accounts.validateNewUser(function (user) {
        console.log('===========> Accounts.validateNewUser()');
        console.log(Meteor.user());
        console.log(Meteor.users.find({}).count());
        console.log(user);
        if((Meteor.users.find({}).count() != 0)
            &&  ((Meteor.user() == null)
                ||  (Meteor.user() != null && !Meteor.user().profile.isRoot)
                ||  Meteor.users.findOne({"username": user.username}))) {
            return false;
        }
        return true;
    });
}
