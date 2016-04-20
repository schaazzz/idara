import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

Meteor.users.deny({
    update: function() {
        return true;
    }
});

if (Meteor.isServer) {
    Accounts.validateLoginAttempt(function (info) {
        console.log('===========> Accounts.validateLoginAttempt()');
        console.log(info);
        var result = false;

        if (info.user) {
            result = !info.user.profile.disableLogin;
            var newProfile = info.user.profile;
            newProfile.disableLogin = false;
            Meteor.users.update({'username': info.user.username}, {$set: {profile: newProfile} });
        }
        return result;
    });

    Accounts.onCreateUser(function (options, user) {
        console.log('===========> Accounts.onCreateUser()');
        if (Meteor.user().profile.isRoot) {
            user.profile = options.profile;
            user.profile.disableLogin = true;
            console.log(user);
            return user;
        } else {
            console.log('Not authorized...');
            throw new Meteor.Error('not-authorized');
            return null;
        }
    });

    Accounts.validateNewUser(function (user) {
        console.log('===========> Accounts.validateNewUser()');
        console.log(Meteor.user());
        console.log(Meteor.users.find({}).count());
        console.log(user);
        if ((Meteor.users.find({}).count() != 0)
            &&  ((Meteor.user() == null)
                ||  (Meteor.user() != null && !Meteor.user().profile.isRoot)
                ||  Meteor.users.findOne({"username": user.username}))) {
            return false;
        }
        return true;
    });
}
