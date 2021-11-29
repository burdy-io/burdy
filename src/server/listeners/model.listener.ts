import Hooks from "@shared/features/hooks";
import Asset from "@server/models/asset.model";
import AssetMeta from "@server/models/asset-meta.model";
import ContentType from "@server/models/content-type.model";
import Group from "@server/models/group.model";
import Post from "@server/models/post.model";
import PostMeta from "@server/models/post-meta.model";
import SiteSettings from "@server/models/site-settings.model";
import Tag from "@server/models/tag.model";
import TagMeta from "@server/models/tag-meta.model";
import User from "@server/models/user.model";
import UserMeta from "@server/models/user-meta.model";
import UserSession from "@server/models/user-session.model";
import UserToken from "@server/models/user-token.model";
import Backup from "@server/models/backup.model";
import AccessToken from '@server/models/access-token';

Hooks.addFilter('db/models', async (args) => {
  return [
    AccessToken,
    Asset,
    AssetMeta,
    Backup,
    ContentType,
    Group,
    Post,
    PostMeta,
    SiteSettings,
    Tag,
    TagMeta,
    User,
    UserMeta,
    UserSession,
    UserToken,
    ...args
  ];
});
