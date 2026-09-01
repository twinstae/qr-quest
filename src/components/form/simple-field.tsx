import { useId, type ChangeEvent, type ComponentProps } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input.tsx";
import * as Field from "@/components/ui/field.tsx";
import * as Checkbox from "@/components/ui/checkbox.tsx";
import { getApiClient } from "@/lib/api-client.ts";
import * as FileUpload from "@/components/ui/file-upload.tsx";
import { UploadIcon, XIcon } from "lucide-react";
import { IconButton } from "../ui/icon-button";
import { useFileUploadContext } from "@ark-ui/react/file-upload";
import { css } from "styled-system/css";

// export function SimpleDatePicker({ name, label }: { name: string; label: string }) {
//   const { control } = useFormContext();

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <div>
//           <Label>{label}</Label>
//           <DatePicker
//             name={name}
//             aria-label={label}
//             isInvalid={fieldState.invalid}
//             value={field.value ? parseDate(field.value) : null}
//             onChange={(value) => field.onChange(value?.toString())}
//           />
//           <SimpleErrorMessage name={name} />
//         </div>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }

export function SimpleInput({
  name,
  label,
  hint,
  ...props
}: ComponentProps<typeof Input> & { name: string; label: string; hint?: string }) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const isError = !!fieldState.error;

        const errorMessage = fieldState.error?.root?.message ?? fieldState.error?.message;
        return (
          <Field.Root>
            <Field.Label>
              {label} {props.required && <Field.RequiredIndicator />}
            </Field.Label>
            <Input
              name={name}
              value={field.value}
              onChange={field.onChange}
              aria-invalid={isError}
              aria-describedby={isError ? errorId : hint ? descriptionId : undefined}
              aria-errormessage={isError ? errorId : undefined}
              {...props}
            />
            {hint && !isError && <Field.HelperText id={descriptionId}>{hint}</Field.HelperText>}
            {isError && errorMessage && (
              <Field.ErrorText id={errorId} role="alert" aria-label={errorMessage}>
                {errorMessage}
              </Field.ErrorText>
            )}
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}

export function SimpleCheckbox({
  name,
  label,
  hint,
  ...props
}: Checkbox.RootProps & { name: string; label: string; hint?: string }) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const isError = !!fieldState.error;

        const errorMessage = fieldState.error?.root?.message ?? fieldState.error?.message;
        return (
          <Field.Root>
            <Checkbox.Root name={name} value={field.value} onChange={field.onChange}>
              <Checkbox.HiddenInput
                aria-invalid={isError}
                aria-describedby={isError ? errorId : hint ? descriptionId : undefined}
                aria-errormessage={isError ? errorId : undefined}
              />
              <Checkbox.Control aria-invalid={isError}>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                {label} {props.required && <Field.RequiredIndicator />}
              </Checkbox.Label>
            </Checkbox.Root>
            {hint && !isError && <Field.HelperText id={descriptionId}>{hint}</Field.HelperText>}
            {isError && errorMessage && (
              <Field.ErrorText id={errorId} role="alert" aria-label={errorMessage}>
                {errorMessage}
              </Field.ErrorText>
            )}
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}

export type SimpleImageValue = { src: string; alt: string };

const FileUploadList = () => {
  const fileUpload = useFileUploadContext();
  const files = fileUpload.acceptedFiles;
  if (files.length === 0)
    return (
      <FileUpload.Dropzone className={css({ minHeight: "160px" })}>
        <UploadIcon />
        <p>이미지를 업로드하세요</p>
      </FileUpload.Dropzone>
    );

  return (
    <FileUpload.ItemGroup>
      {files.map((file) => (
        <FileUpload.Item file={file} key={file.name} p="0.5" w="fit-content">
          <FileUpload.ItemPreviewImage />
          <FileUpload.ItemDeleteTrigger asChild>
            <IconButton size="2xs" borderRadius="full" pos="absolute" top="-2" right="-2">
              <XIcon />
            </IconButton>
          </FileUpload.ItemDeleteTrigger>
        </FileUpload.Item>
      ))}
    </FileUpload.ItemGroup>
  );
};

// 업로드만 지원한다 (외부 URL 붙여넣기 없음) — ticket 04 결정 사항.
export function SimpleImageUpload({
  name,
  label,
  hint,
  required,
}: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
}) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const isError = !!fieldState.error || status === "error";
        const errorMessage = fieldState.error?.root?.message ?? fieldState.error?.message;

        async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
          const file = event.target.files?.[0];
          if (!file) return;

          const client = getApiClient();
          const { data: presigned } = await client.uploads.presign.post({
            filename: file.name,
            contentType: file.type,
          });
          if (!presigned) {
            return;
          }

          const uploadResponse = await fetch(presigned.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!uploadResponse.ok) {
            return;
          }

          field.onChange({ src: presigned.publicUrl, alt: file.name } satisfies SimpleImageValue);
        }

        return (
          <Field.Root>
            <Field.Label>
              {label} {required && <Field.RequiredIndicator />}
            </Field.Label>
            <FileUpload.Root>
              <FileUpload.HiddenInput
                onChange={handleFileChange}
                aria-invalid={isError}
                aria-describedby={isError ? errorId : hint ? descriptionId : undefined}
                aria-errormessage={isError ? errorId : undefined}
              />
              <FileUploadList />
            </FileUpload.Root>
            {isError && (
              <Field.ErrorText id={errorId} role="alert">
                {errorMessage}
              </Field.ErrorText>
            )}
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}

// const defaultRender = (item: SelectItemType) => (
//   <Select.Item
//     id={item.id}
//     supportingText={item.supportingText}
//     isDisabled={item.isDisabled}
//     icon={item.icon}
//     avatarUrl={item.avatarUrl}
//   >
//     {item.label}
//   </Select.Item>
// );

// export function SimpleComboboxWithSelect({
//   name,
//   label,
//   items,
//   ...props
// }: Omit<ComponentProps<typeof Select.ComboBox>, "children"> & {
//   name: string;
//   label: string;
//   items: SelectItemType[];
//   children?: (item: SelectItemType) => ReactNode;
// }) {
//   const { control } = useFormContext();

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <Select.ComboBox
//           name={name}
//           label={label}
//           items={items}
//           selectedKey={field.value}
//           onSelectionChange={(selectedKey) => {
//             field.onChange(selectedKey);
//           }}
//           isInvalid={fieldState.invalid}
//           hint={fieldState.error?.message}
//           {...props}
//         >
//           {props.children ?? defaultRender}
//         </Select.ComboBox>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }

// export function SimpleSelect({
//   name,
//   label,
//   items,
//   ...props
// }: Omit<ComponentProps<typeof Select>, "children"> & {
//   name: string;
//   label: string;
//   items: SelectItemType[];
//   children?: (item: SelectItemType) => ReactNode;
// }) {
//   const { control } = useFormContext();

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <Select
//           name={name}
//           aria-label={label}
//           items={items}
//           value={field.value}
//           onChange={field.onChange}
//           isInvalid={fieldState.invalid}
//           hint={fieldState.error?.message}
//           {...props}
//         >
//           {props.children ?? defaultRender}
//         </Select>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }

// export function SimpleInputGroup({
//   name,
//   label,
//   ...props
// }: Omit<ComponentProps<typeof InputGroup>, "children"> & {
//   name: string;
//   label: string;
//   children?: ReactNode;
// }) {
//   const { control } = useFormContext();

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <InputGroup
//           isRequired
//           name={name}
//           label={label}
//           value={field.value?.toString()}
//           onChange={field.onChange}
//           isInvalid={fieldState.invalid}
//           hint={fieldState.error?.message}
//           {...props}
//         >
//           <InputBase name={name} />
//         </InputGroup>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }

// function parseSafeNumber(input?: string): number | undefined {
//   if (!input) return undefined;

//   // 허용: 음수, 소수점, 숫자만 유지
//   const cleaned = input.replace(/[^0-9.-]/g, "");

//   // 입력 중간 상태는 아직 값으로 확정하지 않음
//   if (cleaned === "-" || cleaned === "." || cleaned === "-." || cleaned === "") {
//     return undefined;
//   }

//   const result = Number(cleaned);

//   invariant(!Number.isNaN(result), "Invalid number input: " + input);
//   return result;
// }

// export function SimpleNumberInputGroup({
//   name,
//   label,
//   shortcut,
//   ...props
// }: Omit<ComponentProps<typeof InputGroup>, "children"> & {
//   name: string;
//   label: string;
//   shortcut?: string | ((value: number) => string);
// }) {
//   const { control } = useFormContext();

//   const render = useCallback(
//     ({ field, fieldState }: Parameters<ComponentProps<typeof Controller>["render"]>[0]) => {
//       const [innerValue, setInnerValue] = React.useState(field.value?.toString() ?? "");

//       React.useEffect(() => {
//         setInnerValue(field.value?.toString() ?? "");
//       }, [field.value]);

//       return (
//         <InputGroup
//           name={name}
//           isRequired
//           label={label}
//           value={innerValue}
//           isInvalid={fieldState.invalid}
//           hint={fieldState.error?.message}
//           onChange={(value) => {
//             setInnerValue(value.replace(/[^0-9.-]/g, ""));

//             const parsed = parseSafeNumber(value);

//             if (parsed !== undefined) {
//               field.onChange(parsed);
//             }
//           }}
//           {...props}
//         >
//           <InputBase
//             name={name}
//             maxLength={14}
//             shortcut={
//               typeof shortcut === "function"
//                 ? field.value
//                   ? shortcut(field.value)
//                   : undefined
//                 : shortcut
//             }
//           />
//         </InputGroup>
//       );
//     },
//     [name, label, props],
//   );

//   return <Controller control={control} name={name} render={render} />;
// }

// export function SimpleMultiSelect({
//   name,
//   label,
//   items,
//   ...props
// }: Omit<ComponentProps<typeof MultiSelect>, "children" | "selectedItems"> & {
//   name: string;
//   label: string;
//   items: SelectItemType[];
//   children?: (item: SelectItemType) => ReactNode;
// }) {
//   const { control, getValues } = useFormContext();

//   const value = getValues(name);

//   const selectedItems = useListData({
//     initialItems: items.filter((item) => value?.includes(item.id)) as SelectItemType[],
//   });

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <MultiSelect
//           name={name}
//           label={label}
//           selectedItems={selectedItems}
//           isInvalid={fieldState.invalid}
//           hint={fieldState.error?.message}
//           items={items}
//           onItemInserted={(selectedKey) => {
//             field.onChange([...field.value, selectedKey]);
//           }}
//           onItemCleared={(selectedKey) => {
//             const old = field.value;
//             invariant(Array.isArray(old));
//             field.onChange(old.filter((id) => id !== selectedKey));
//           }}
//           {...props}
//         >
//           {(item) => (
//             <MultiSelect.Item id={item.id} label={item.label} isDisabled={item.isDisabled}>
//               {item.label}
//             </MultiSelect.Item>
//           )}
//         </MultiSelect>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }
