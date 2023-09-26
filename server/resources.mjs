import { Model, NotNull, Property, Unique } from '@cloud-cli/store';

class Component {
  uid;
  name;
  definition;
}

export const WDSComponent = Model('component')(Component);

const p = Component.prototype;
p.uid = Property(String)(p.uid);
p.name = Property(String)(p.name);
p.definition = Property(Object, {})(p.definition);
