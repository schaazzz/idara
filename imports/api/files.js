import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Projects } from './projects';
import { Issues } from './issues';

export const files = new FileCollection(
                                    'files', {
                                        resumable: false,
                                        http: [{
                                            method: 'get',
                                            path: '/:md5',
                                            lookup: function (params, query) {
                                                return {md5: params.md5};
                                            }
                                    }]});
