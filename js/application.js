/**
 * Multi-step application workflow (demo / localStorage)
 */

const Application = {
  STORAGE_KEY: "cun_applications",
  CURRENT_KEY: "cun_current_application",

  getAll() {
    return Store.get(this.STORAGE_KEY, []);
  },

  saveAll(list) {
    Store.set(this.STORAGE_KEY, list);
  },

  getCurrent() {
    return Store.get(this.CURRENT_KEY, {});
  },

  setCurrent(data) {
    Store.set(this.CURRENT_KEY, data);
  },

  clearCurrent() {
    Store.remove(this.CURRENT_KEY);
  },

  submit(data) {
    const appNumber = generateAppNumber();
    const record = {
      ...data,
      applicationNumber: appNumber,
      status: "received",
      submittedAt: new Date().toISOString(),
      history: [{ status: "received", date: new Date().toISOString(), note: "Application submitted (demo)" }]
    };
    const all = this.getAll();
    all.push(record);
    this.saveAll(all);
    this.clearCurrent();
    return record;
  },

  findByNumberAndEmail(number, email) {
    return this.getAll().find(
      (a) => a.applicationNumber === number && (a.email || "").toLowerCase() === email.toLowerCase()
    );
  }
};

window.Application = Application;
