const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const collections = new Map();
let isPatched = false;

const PERSIST_FILE = path.join(__dirname, '../database/memory_store.json');

const getCollection = (modelName) => {
  if (!collections.has(modelName)) {
    collections.set(modelName, []);
  }
  return collections.get(modelName);
};

const getByPath = (obj, dotPath) => {
  if (!obj || !dotPath) return undefined;
  return dotPath.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
};

const setByPath = (obj, dotPath, value) => {
  const parts = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
};

const isEqualVal = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return String(a) === String(b);
};

const matchesCondition = (val, cond) => {
  if (cond instanceof RegExp) {
    return typeof val === 'string' && cond.test(val);
  }
  if (
    cond &&
    typeof cond === 'object' &&
    !(cond instanceof Date) &&
    !(cond instanceof mongoose.Types.ObjectId) &&
    !cond._bsontype
  ) {
    const keys = Object.keys(cond);
    if (keys.some((k) => k.startsWith('$'))) {
      for (const k of keys) {
        const target = cond[k];
        if (k === '$in') {
          if (!Array.isArray(target)) return false;
          if (Array.isArray(val)) {
            if (!val.some((v) => target.some((t) => isEqualVal(v, t)))) return false;
          } else if (!target.some((t) => isEqualVal(val, t))) {
            return false;
          }
        } else if (k === '$nin') {
          if (Array.isArray(target) && target.some((t) => isEqualVal(val, t))) return false;
        } else if (k === '$ne') {
          if (isEqualVal(val, target)) return false;
        } else if (k === '$gt') {
          const v = val instanceof Date ? val.getTime() : new Date(val).getTime() || Number(val);
          const t = target instanceof Date ? target.getTime() : new Date(target).getTime() || Number(target);
          if (!(Number(val ?? v) > Number(target ?? t) || v > t)) return false;
        } else if (k === '$gte') {
          if (val instanceof Date || target instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)))) {
            if (!(new Date(val).getTime() >= new Date(target).getTime())) return false;
          } else if (!(Number(val) >= Number(target))) {
            return false;
          }
        } else if (k === '$lt') {
          if (val instanceof Date || target instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)))) {
            if (!(new Date(val).getTime() < new Date(target).getTime())) return false;
          } else if (!(Number(val) < Number(target))) {
            return false;
          }
        } else if (k === '$lte') {
          if (val instanceof Date || target instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)))) {
            if (!(new Date(val).getTime() <= new Date(target).getTime())) return false;
          } else if (!(Number(val) <= Number(target))) {
            return false;
          }
        } else if (k === '$exists') {
          const exists = val !== undefined;
          if (Boolean(target) !== exists) return false;
        } else if (k === '$regex') {
          const flags = cond.$options || '';
          const re = target instanceof RegExp ? target : new RegExp(target, flags);
          if (!re.test(String(val || ''))) return false;
        }
      }
      return true;
    }
  }
  if (Array.isArray(val) && !Array.isArray(cond)) {
    return val.some((v) => isEqualVal(v, cond));
  }
  return isEqualVal(val, cond);
};

const matchesFilter = (doc, filter) => {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, cond] of Object.entries(filter)) {
    if (key === '$or') {
      if (!Array.isArray(cond) || !cond.some((sub) => matchesFilter(doc, sub))) return false;
    } else if (key === '$and') {
      if (!Array.isArray(cond) || !cond.every((sub) => matchesFilter(doc, sub))) return false;
    } else {
      const val = key.includes('.') ? getByPath(doc, key) : doc[key];
      if (!matchesCondition(val, cond)) return false;
    }
  }
  return true;
};

const applyDefaults = (modelName, data) => {
  const now = new Date();
  const doc = { ...data };
  if (!doc._id) {
    doc._id = new mongoose.Types.ObjectId();
  }
  if (!doc.createdAt) doc.createdAt = now;
  doc.updatedAt = now;

  if (modelName === 'User') {
    if (doc.role === undefined) doc.role = 'user';
    if (doc.avatar === undefined) doc.avatar = '/uploads/profile-images/default-avatar.png';
    if (doc.fitnessLevel === undefined) doc.fitnessLevel = 'Intermediate';
    if (doc.bio === undefined) doc.bio = 'Fitness and outdoor adventure enthusiast!';
    if (doc.phone === undefined) doc.phone = '';
    if (doc.age === undefined) doc.age = 22;
    if (doc.fitnessScore === undefined) doc.fitnessScore = 75;
    if (!doc.fitnessAssessment) {
      doc.fitnessAssessment = {
        endurance: 75,
        strength: 70,
        flexibility: 70,
        stamina: 75,
        assessmentScore: 73,
        assessedAt: now,
      };
    }
    if (doc.xp === undefined) doc.xp = 0;
    if (doc.level === undefined) doc.level = 1;
    if (!doc.badges) doc.badges = [];
    if (doc.streakDays === undefined) doc.streakDays = 0;
    if (doc.totalWorkouts === undefined) doc.totalWorkouts = 0;
    if (doc.totalAdventures === undefined) doc.totalAdventures = 0;
    if (!doc.recentlyAccessed) doc.recentlyAccessed = [];
    if (!doc.communicationPreferences) {
      doc.communicationPreferences = {
        emailNotifications: true,
        smsNotifications: true,
        whatsappNotifications: false,
        inAppNotifications: true,
      };
    }
  } else if (modelName === 'Booking') {
    if (doc.participants === undefined) doc.participants = 1;
    if (doc.status === undefined) doc.status = 'Confirmed';
    if (doc.checkedIn === undefined) doc.checkedIn = false;
    if (doc.checkedInAt === undefined) doc.checkedInAt = null;
    if (doc.team === undefined) doc.team = 'Team Alpha';
    if (!doc.ticketCode) {
      const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
      doc.ticketCode = `TKT-${randomHex}`;
      doc.qrData = JSON.stringify({
        ticketCode: doc.ticketCode,
        bookingId: doc._id,
        item: doc.itemDetails?.title || 'Adventure',
        user: doc.user,
      });
    }
  } else if (modelName === 'SosIncident') {
    if (doc.status === undefined) doc.status = 'Active';
    if (!doc.incidentId) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      doc.incidentId = `INC-SOS-${rand}`;
    }
  } else if (modelName === 'Adventure') {
    if (doc.status === undefined) doc.status = 'Published';
    if (doc.maxParticipants === undefined) doc.maxParticipants = 12;
    if (doc.rating === undefined) doc.rating = 4.9;
    if (doc.reviewCount === undefined) doc.reviewCount = 42;
    if (doc.requiredFitnessScore === undefined) doc.requiredFitnessScore = 60;
    if (doc.minimumAge === undefined) doc.minimumAge = 18;
    if (doc.requiredEndurance === undefined) doc.requiredEndurance = 50;
    if (doc.requiredStrength === undefined) doc.requiredStrength = 50;
    if (doc.requiredStamina === undefined) doc.requiredStamina = 50;
    if (doc.requiredFlexibility === undefined) doc.requiredFlexibility = 50;
    if (!doc.checkpoints) doc.checkpoints = [];
    if (!doc.guides) doc.guides = [];
    if (!doc.teams) doc.teams = [];
  } else if (modelName === 'Notification') {
    if (doc.type === undefined) doc.type = 'SYSTEM';
    if (doc.read === undefined) doc.read = false;
    if (doc.readAt === undefined) doc.readAt = null;
    if (!doc.metadata) doc.metadata = {};
  } else if (modelName === 'CommunicationLog') {
    if (doc.status === undefined) doc.status = 'PENDING';
    if (!doc.sentAt) doc.sentAt = now;
    if (!doc.metadata) doc.metadata = {};
  }

  return doc;
};

const wrapDoc = (modelName, rawObj) => {
  if (!rawObj) return null;
  if (typeof rawObj.toObject === 'function' && rawObj._isMemDoc) return rawObj;

  const doc = { ...rawObj };
  Object.defineProperty(doc, '_isMemDoc', { value: true, enumerable: false });
  Object.defineProperty(doc, 'id', {
    get() {
      return this._id ? String(this._id) : undefined;
    },
    enumerable: false,
  });
  Object.defineProperty(doc, 'toObject', {
    value: function () {
      const copy = { ...this };
      return copy;
    },
    enumerable: false,
  });
  Object.defineProperty(doc, 'toJSON', {
    value: function () {
      const copy = { ...this };
      return copy;
    },
    enumerable: false,
  });
  Object.defineProperty(doc, 'save', {
    value: async function () {
      this.updatedAt = new Date();
      if (modelName === 'Booking' && !this.ticketCode) {
        const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.ticketCode = `TKT-${randomHex}`;
      }
      if (modelName === 'SosIncident' && !this.incidentId) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.incidentId = `INC-SOS-${rand}`;
      }
      const col = getCollection(modelName);
      const idx = col.findIndex((item) => isEqualVal(item._id, this._id));
      if (idx >= 0) {
        col[idx] = this;
      } else {
        col.push(this);
      }
      return this;
    },
    enumerable: false,
  });

  return doc;
};

const applyUpdateToDoc = (doc, update) => {
  if (!update) return doc;
  for (const [key, val] of Object.entries(update)) {
    if (key === '$set') {
      for (const [k, v] of Object.entries(val)) {
        if (k.includes('.')) setByPath(doc, k, v);
        else doc[k] = v;
      }
    } else if (key === '$inc') {
      for (const [k, v] of Object.entries(val)) {
        const cur = k.includes('.') ? getByPath(doc, k) : doc[k];
        const nextVal = (Number(cur) || 0) + Number(v);
        if (k.includes('.')) setByPath(doc, k, nextVal);
        else doc[k] = nextVal;
      }
    } else if (key === '$push') {
      for (const [k, v] of Object.entries(val)) {
        if (!Array.isArray(doc[k])) doc[k] = [];
        if (v && typeof v === 'object' && Array.isArray(v.$each)) {
          doc[k].push(...v.$each);
          if (typeof v.$slice === 'number') {
            if (v.$slice < 0) doc[k] = doc[k].slice(v.$slice);
            else doc[k] = doc[k].slice(0, v.$slice);
          }
        } else {
          doc[k].push(v);
        }
      }
    } else if (key === '$pull') {
      for (const [k, v] of Object.entries(val)) {
        if (Array.isArray(doc[k])) {
          doc[k] = doc[k].filter((item) => !matchesFilter(item, v) && !isEqualVal(item, v));
        }
      }
    } else if (!key.startsWith('$')) {
      if (key.includes('.')) setByPath(doc, key, val);
      else doc[key] = val;
    }
  }
  doc.updatedAt = new Date();
  return doc;
};

const applySelect = (doc, selectStr) => {
  if (!doc || !selectStr) return doc;
  const clone = wrapDoc(null, { ...doc });
  const parts = String(selectStr).trim().split(/\s+/).filter(Boolean);
  const exclusions = parts.filter((p) => p.startsWith('-')).map((p) => p.slice(1));
  if (exclusions.length > 0) {
    for (const ex of exclusions) {
      delete clone[ex];
    }
    return clone;
  }
  return clone;
};

const resolvePopulateTargetModel = (field, doc) => {
  if (field === 'user' || field === 'userId' || field === 'triggeredBy') return 'User';
  if (field === 'adventure' || field === 'adventureId' || field === 'relatedAdventure') return 'Adventure';
  if (field === 'relatedBooking' || field === 'booking') return 'Booking';
  if (field === 'itemRef') {
    return doc?.itemType === 'Fitness' ? 'Fitness' : 'Adventure';
  }
  return 'User';
};

const applyPopulate = (doc, populates) => {
  if (!doc || !populates || populates.length === 0) return doc;
  const clone = wrapDoc(null, { ...doc });
  for (const pop of populates) {
    const field = typeof pop === 'string' ? pop : pop.path;
    const select = typeof pop === 'object' ? pop.select : undefined;
    const rawId = clone[field];
    if (!rawId) continue;
    if (typeof rawId === 'object' && rawId._id && rawId.name) continue;
    const targetModel = resolvePopulateTargetModel(field, clone);
    const targetCol = getCollection(targetModel);
    const found = targetCol.find((item) => isEqualVal(item._id, rawId) || isEqualVal(item.id, rawId));
    if (found) {
      clone[field] = select ? applySelect(found, select) : wrapDoc(targetModel, { ...found });
    }
  }
  return clone;
};

class MemQuery {
  constructor(modelName, executor, options = {}) {
    this.modelName = modelName;
    this.executor = executor;
    this.options = options;
    this._select = options.select || null;
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._populates = [];
    this._lean = false;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  sort(sortSpec) {
    this._sort = sortSpec;
    return this;
  }

  skip(n) {
    this._skip = Number(n) || 0;
    return this;
  }

  limit(n) {
    this._limit = Number(n);
    return this;
  }

  populate(pathOrObj, select) {
    if (typeof pathOrObj === 'string') {
      this._populates.push({ path: pathOrObj, select });
    } else if (pathOrObj && typeof pathOrObj === 'object') {
      this._populates.push(pathOrObj);
    }
    return this;
  }

  lean() {
    this._lean = true;
    return this;
  }

  async exec() {
    let result = await this.executor();
    if (result == null || typeof result === 'number') return result;

    if (Array.isArray(result)) {
      let arr = [...result];
      if (this._sort) {
        const sortEntries = Object.entries(this._sort);
        arr.sort((a, b) => {
          for (const [k, dir] of sortEntries) {
            const va = getByPath(a, k);
            const vb = getByPath(b, k);
            if (isEqualVal(va, vb)) continue;
            const da = va instanceof Date ? va.getTime() : va;
            const db = vb instanceof Date ? vb.getTime() : vb;
            if (da < db) return dir === -1 || dir === 'desc' ? 1 : -1;
            if (da > db) return dir === -1 || dir === 'desc' ? -1 : 1;
          }
          return 0;
        });
      }
      if (this._skip > 0) arr = arr.slice(this._skip);
      if (this._limit != null && this._limit >= 0) arr = arr.slice(0, this._limit);
      arr = arr.map((item) => {
        let d = applyPopulate(item, this._populates);
        if (this._select) d = applySelect(d, this._select);
        return this._lean && d?.toObject ? d.toObject() : d;
      });
      return arr;
    } else {
      let d = applyPopulate(result, this._populates);
      if (this._select) d = applySelect(d, this._select);
      return this._lean && d?.toObject ? d.toObject() : d;
    }
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

const patchModel = (modelName, Model) => {
  if (!Model || Model._memPatched) return;
  Model._memPatched = true;

  getCollection(modelName);

  Model.find = function (filter = {}, projection = null) {
    return new MemQuery(
      modelName,
      async () => {
        const col = getCollection(modelName);
        return col.filter((doc) => matchesFilter(doc, filter));
      },
      { select: typeof projection === 'string' ? projection : null }
    );
  };

  Model.findOne = function (filter = {}, projection = null) {
    return new MemQuery(
      modelName,
      async () => {
        const col = getCollection(modelName);
        return col.find((doc) => matchesFilter(doc, filter)) || null;
      },
      { select: typeof projection === 'string' ? projection : null }
    );
  };

  Model.findById = function (id, projection = null) {
    return new MemQuery(
      modelName,
      async () => {
        if (!id) return null;
        const col = getCollection(modelName);
        return col.find((doc) => isEqualVal(doc._id, id) || isEqualVal(doc.id, id)) || null;
      },
      { select: typeof projection === 'string' ? projection : null }
    );
  };

  Model.create = async function (docOrDocs) {
    const col = getCollection(modelName);
    if (Array.isArray(docOrDocs)) {
      const created = docOrDocs.map((item) => {
        const raw = item?.toObject ? item.toObject() : item;
        const doc = wrapDoc(modelName, applyDefaults(modelName, raw));
        col.push(doc);
        return doc;
      });
      return created;
    }
    const raw = docOrDocs?.toObject ? docOrDocs.toObject() : docOrDocs;
    const doc = wrapDoc(modelName, applyDefaults(modelName, raw));
    col.push(doc);
    return doc;
  };

  Model.insertMany = async function (docs = []) {
    return Model.create(docs);
  };

  Model.findByIdAndUpdate = function (id, update, options = {}) {
    return new MemQuery(
      modelName,
      async () => {
        const col = getCollection(modelName);
        const doc = col.find((d) => isEqualVal(d._id, id) || isEqualVal(d.id, id));
        if (!doc) return null;
        applyUpdateToDoc(doc, update);
        return doc;
      },
      { select: options?.select || null }
    );
  };

  Model.findOneAndUpdate = function (filter, update, options = {}) {
    return new MemQuery(
      modelName,
      async () => {
        const col = getCollection(modelName);
        let doc = col.find((d) => matchesFilter(d, filter));
        if (!doc && options?.upsert) {
          doc = wrapDoc(modelName, applyDefaults(modelName, { ...filter }));
          col.push(doc);
        }
        if (!doc) return null;
        applyUpdateToDoc(doc, update);
        return doc;
      },
      { select: options?.select || null }
    );
  };

  Model.findByIdAndDelete = function (id) {
    return new MemQuery(modelName, async () => {
      const col = getCollection(modelName);
      const idx = col.findIndex((d) => isEqualVal(d._id, id) || isEqualVal(d.id, id));
      if (idx === -1) return null;
      const [removed] = col.splice(idx, 1);
      return removed;
    });
  };

  Model.findOneAndDelete = function (filter) {
    return new MemQuery(modelName, async () => {
      const col = getCollection(modelName);
      const idx = col.findIndex((d) => matchesFilter(d, filter));
      if (idx === -1) return null;
      const [removed] = col.splice(idx, 1);
      return removed;
    });
  };

  Model.updateMany = async function (filter = {}, update = {}) {
    const col = getCollection(modelName);
    let modifiedCount = 0;
    for (const doc of col) {
      if (matchesFilter(doc, filter)) {
        applyUpdateToDoc(doc, update);
        modifiedCount++;
      }
    }
    return { acknowledged: true, modifiedCount };
  };

  Model.deleteMany = async function (filter = {}) {
    const col = getCollection(modelName);
    const before = col.length;
    const remaining = col.filter((doc) => !matchesFilter(doc, filter));
    collections.set(modelName, remaining);
    return { acknowledged: true, deletedCount: before - remaining.length };
  };

  Model.countDocuments = function (filter = {}) {
    return new MemQuery(modelName, async () => {
      const col = getCollection(modelName);
      return col.filter((doc) => matchesFilter(doc, filter)).length;
    });
  };

  Model.distinct = function (field, filter = {}) {
    return new MemQuery(modelName, async () => {
      const col = getCollection(modelName);
      const matched = col.filter((doc) => matchesFilter(doc, filter));
      const set = new Set();
      const result = [];
      for (const doc of matched) {
        const val = getByPath(doc, field);
        if (val !== undefined && !set.has(String(val))) {
          set.add(String(val));
          result.push(val);
        }
      }
      return result;
    });
  };

  Model.aggregate = async function (pipeline = []) {
    let docs = [...getCollection(modelName)];
    for (const stage of pipeline) {
      if (stage.$match) {
        docs = docs.filter((d) => matchesFilter(d, stage.$match));
      } else if (stage.$group) {
        const idExpr = stage.$group._id;
        const groups = new Map();
        for (const d of docs) {
          const groupKey =
            idExpr === null
              ? '__null__'
              : typeof idExpr === 'string' && idExpr.startsWith('$')
              ? getByPath(d, idExpr.slice(1)) ?? null
              : idExpr;
          const mapKey = String(groupKey);
          if (!groups.has(mapKey)) {
            groups.set(mapKey, { _id: groupKey, items: [] });
          }
          groups.get(mapKey).items.push(d);
        }
        const out = [];
        for (const g of groups.values()) {
          const row = { _id: g._id };
          for (const [field, accum] of Object.entries(stage.$group)) {
            if (field === '_id') continue;
            if (accum.$sum !== undefined) {
              if (accum.$sum === 1) {
                row[field] = g.items.length;
              } else if (typeof accum.$sum === 'string' && accum.$sum.startsWith('$')) {
                const prop = accum.$sum.slice(1);
                row[field] = g.items.reduce((s, it) => s + (Number(getByPath(it, prop)) || 0), 0);
              }
            } else if (accum.$avg !== undefined && typeof accum.$avg === 'string' && accum.$avg.startsWith('$')) {
              const prop = accum.$avg.slice(1);
              const vals = g.items.map((it) => Number(getByPath(it, prop)) || 0);
              row[field] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            }
          }
          out.push(row);
        }
        docs = out;
      } else if (stage.$sort) {
        const sortEntries = Object.entries(stage.$sort);
        docs.sort((a, b) => {
          for (const [k, dir] of sortEntries) {
            if (a[k] < b[k]) return dir === -1 ? 1 : -1;
            if (a[k] > b[k]) return dir === -1 ? -1 : 1;
          }
          return 0;
        });
      } else if (stage.$limit) {
        docs = docs.slice(0, Number(stage.$limit));
      }
    }
    return docs;
  };

  if (Model.prototype) {
    Model.prototype.save = async function () {
      const plain = this.toObject ? this.toObject() : { ...this };
      const col = getCollection(modelName);
      const existingIdx = col.findIndex((item) => isEqualVal(item._id, plain._id));
      const wrapped = wrapDoc(modelName, applyDefaults(modelName, plain));
      if (existingIdx >= 0) {
        col[existingIdx] = wrapped;
      } else {
        col.push(wrapped);
      }
      Object.assign(this, wrapped);
      return wrapped;
    };
  }
};

const activateInMemoryMongoose = () => {
  if (isPatched) return;
  isPatched = true;

  mongoose.set('bufferCommands', false);

  // Explicit static requires so Netlify/Vercel serverless bundlers include all models
  try {
    require('../models/User');
    require('../models/Adventure');
    require('../models/Fitness');
    require('../models/Booking');
    require('../models/Exercise');
    require('../models/Bmi');
    require('../models/WorkoutLog');
    require('../models/FitnessAssessment');
    require('../models/Notification');
    require('../models/CommunicationLog');
    require('../models/SosIncident');
  } catch (err) {
    console.warn('[InMemoryDB] Static model load warning:', err.message);
  }

  for (const [modelName, Model] of Object.entries(mongoose.models)) {
    patchModel(modelName, Model);
  }
};

module.exports = {
  activateInMemoryMongoose,
  getCollection,
};
