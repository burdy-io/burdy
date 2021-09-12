import React, { useEffect, useMemo, useState } from 'react';
import {
  Label,
  mergeStyleSets,
  Pivot,
  PivotItem,
  Stack
} from '@fluentui/react';
import DynamicField from './dynamic-field';
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';

const styles = mergeStyleSets({
  hide: {
    display: 'none !important'
  },
  fields: {
    paddingTop: 10
  }
});

interface TabsItemProps {
  key: string;
  name?: string;
}

interface TabsProps {
  items: TabsItemProps[];
  onSelected: (e: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ items, onSelected }) => {
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    if (!selectedKey && items?.length > 0) {
      setSelectedKey(items?.[0]?.key);
    }
  }, [items]);

  useEffect(() => {
    onSelected(selectedKey);
  }, [selectedKey]);

  return (
    <div>
      <Pivot
        selectedKey={selectedKey}
        headersOnly
        aria-label='Basic Pivot'
        onLinkClick={(item) => {
          setSelectedKey(item?.props?.itemKey);
        }}
      >
        {items.map((item) => (
          <PivotItem
            key={item.key}
            itemKey={item.key}
            headerText={item?.name?.length > 0 ? item?.name : item?.key}
            style={{ paddingTop: 20 }}
          />
        ))}
      </Pivot>
    </div>
  );
};

interface DynamicGroupProps {
  field: any;
  name?: string;
}

const DynamicGroup: React.FC<DynamicGroupProps> = ({ field, name }) => {
  const [selectedTab, setSelectedTab] = useState(null);

  const { getValues, register, unregister, setValue } = useExtendedFormContext();

  const [finished, setFinished] = useState(false);

  const tabs = useMemo(() => {
    if ((field?.fields ?? []).find((field) => field?.type === 'tab')) {
      const tmpTabs = [];
      let i = -1;

      if (field?.fields?.[0]?.type !== 'tab') {
        tmpTabs.push({
          name: 'default',
          label: 'Default',
          fields: []
        });
        i++;
      }

      (field?.fields ?? []).forEach((fld) => {
        if (fld?.type === 'tab') {
          i++;
          tmpTabs.push({
            name: fld?.name,
            label: fld?.label,
            fields: []
          });
        } else {
          tmpTabs[i].fields.push(fld);
        }
      });
      return tmpTabs;
    }
    return [];
  }, [field?.fields]);

  useEffect(() => {
    // This logic unregisters value if it is not same type between stored values and content type
    // And resets value of the field if same not but not same type
    const toRemove = [];
    const toReset = [];
    if (field?.fields?.length) {
      const getFormValues = () => {
        const val = name ? (getValues() || {})?.[name] : getValues();
        return val || {};
      };
      const formValues: any = getFormValues();
      const fields = field?.fields || [];
      Object.keys(formValues).forEach((key) => {
        if (key.indexOf('_$type') > -1) {
          if (!fields.find(field => field?.name === key.slice(0, key.indexOf('_$type')))) {
            toRemove.push(name ? `${name}.${key}` : key);
          } else if (fields.find(field =>
            field?.name === key.slice(0, key.indexOf('_$type')) &&
            field?.type !== formValues?.[key])) {
            const field = fields.find(field =>
              field?.name === key.slice(0, key.indexOf('_$type')));
            toReset.push({
              key: name ? `${name}.${key}` : key,
              value: field?.type
            });
          }
        } else if (key.indexOf('_$type') === -1) {
          if (!fields.find(field => field?.name === key)) {
            toRemove.push(name ? `${name}.${key}` : key);
          } else if (fields.find(field => field?.name === key && field?.type !== formValues?.[`${key}_$type`])) {
            toReset.push({
              key: name ? `${name}.${key}` : key
            });
          }
        }
      });
    }
    toRemove.forEach(key => {
      register(key);
      unregister(key);
    });
    toReset.forEach(obj => {
      setValue(obj?.key, obj?.value);
    });
    setFinished(true);
  }, [field?.fields]);

  return (
    finished && (
      <>
        {field?.label?.length > 0 && <Label>{field?.label}</Label>}
        {tabs?.length > 0 && (
          <>
            <Tabs
              items={tabs.map((tab) => ({
                key: tab.name,
                name: tab.label
              }))}
              onSelected={(e) => setSelectedTab(e)}
            />

            {tabs.map((tab) => (
              <Stack
                key={tab.name}
                className={`${styles.fields} ${
                  tab?.name !== selectedTab ? styles.hide : ''
                }`}
                tokens={{ childrenGap: 10 }}
              >
                {(tab?.fields ?? []).map((field) => (
                  <DynamicField key={field.name} field={field} name={name} />
                ))}
              </Stack>
            ))}
          </>
        )}
        {tabs?.length === 0 && (
          <Stack tokens={{ childrenGap: 10 }}>
            {(field?.fields ?? []).map((field) => (
              <DynamicField key={field.name} field={field} name={name} />
            ))}
          </Stack>
        )}
      </>
    )
  );
};

export default DynamicGroup;
