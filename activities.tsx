import React, { useState, useRef } from "react";

import { Box, Tooltip, FormControl, FormGroup, Grid } from "@material-ui/core";

import { withStyles } from "@material-ui/core/styles";

import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";

import { Formik } from "formik";

import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import {
  TitleContent,
  SubTitleContent,
  TitleModal,
  DoneIconStyled,
  CloseIconStyled,
} from "./styles";

import CheckBox from "../../../components/Checkbox";
import Action from "./actions";
import Risks from "./risks";

import service from "../../../services/Checklist";
import notify from "../../../services/notify";

const Accordion = withStyles({
  root: {
    margin: ".4rem 0",
    border: "1px solid #E2ECF3",
    backgroundColor: "#F8F9FA",
    boxShadow: "none",
    "&:before": {
      display: "none",
    },
  },
  expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    backgroundColor: "rgba(0, 0, 0, .03)",
    borderBottom: "1px solid rgba(0, 0, 0, .125)",
    marginBottom: -1,
    minHeight: 56,
    padding: ".5rem",
    "&$expanded": {
      minHeight: 56,
    },
  },
  content: {
    marginLeft: "1rem",
    "&$expanded": {
      marginLeft: "1rem",
    },
  },
  expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
  root: {
    padding: ".6rem",
  },
}))(MuiAccordionDetails);

//WILL RUN FUNCTIONS BEFORE RENDING THE COMPONENT
const useComponentWillMount = (func: any) => {
  const willMount = useRef(true);

  if (willMount.current) func();

  willMount.current = false;
};

const Activities = (props: any, Risks: any) => {
  const { submitFunction, execution } = props;
  const risk_prevention_id = execution?.riskpreventions?.id;

  const [itemRisk, setItemRisk] = useState<number>(1);
  const [initial_values, setInitial_values] = useState<any>();
  const [isValid, setIsValid] = useState<boolean>(false);
  const [none, setNone] = useState<boolean>(false);
  // const [submit, setSubmit] = useState<boolean>(false);

  const [activityLabels, setActivityLabels] = useState<any[]>([]);

  const initialize = async () => {
    await service.listByExecutionAndType(execution.id, 2);
    const activityLabelsAux = service.getItems().map((e: any) => ({
      ...e,
      error: false,
      touched: false,
      expanded: false,
    }));

    
    activityLabelsAux.map((activity: any) =>
      activity.items.push({
        id: "0",
        name: "Esta tarefa não será executada",
      })
    );

    let objValues: any = {
      count: {},
      check: {},
    };

    //SET THE AMOUNT OF CHECKED ITEMS
    activityLabelsAux.map(
      (activity: any) => (objValues.count[activity.id] = 0)
    );

    //SET THE ITEMS EQUALS FALSE
    activityLabelsAux.map((activity: any) => {
      objValues.check[activity.id] = {};
      return activity.items.map((item: any, i: number) => {
        const isChecked =
          i === activity.items.length - 1
            ? !activity.items[i - 1].check
            : Boolean(item.id === "0") !== Boolean(item.check);
        if (isChecked) objValues.count[activity.id] += 1;
        return (objValues.check[activity.id][item.id] = isChecked);
      });
    });

    setActivityLabels(activityLabelsAux);
    setInitial_values(objValues);
  };

  useComponentWillMount(initialize);

  const submition = async (values: any) => {
    let checklist_item_ids = [];
    for (const activity of Object.keys(values.check)) {
      for (const item of Object.keys(values["check"][activity])) {
        if (values["check"][activity][item] && item !== "0") {
          checklist_item_ids.push(item);
        }
      }
    }
    const data = {
      risk_prevention_id,
      checklist_item_id: checklist_item_ids,
    };
    const res = await service.create(data);

    if (res) submitFunction(values);
  };

  const getBoolean = (fields: any[]) =>
    fields
      .filter((item: any) => item[0] !== "0")
      .some((item: any) => {
        return item[1];
      });

  const getValidation = (values: any) => {
    if (values?.check) {
      let countTotalLabelsOk = 0;
      let countTotalLabelsNotOk = activityLabels.length;

      let totalCheck = 0;
      let totalNotCheck = 0;

      let countCheckNotOk = 0;

      activityLabels.map((activity: any, index: number) => {
        let checkTotalOk = 0;

        countTotalLabelsOk += activity.items.length - 1;

        if (values.check[activity.id]["0"]) countCheckNotOk += 1;

        activity.items
          .filter((_: string, i: number) => i < activity.items.length - 1)
          .map((item: any) => {
            if (values.check[activity.id][item.id]) {
              totalCheck += 1;
              checkTotalOk += 1;
            }

            return 0;
          });

        activity.items
          .filter((_: any) => values.check[activity.id]["0"])
          .map((item: any) => {
            if (!values.check[activity.id][item.id]) totalNotCheck += 1;
            return 0;
          });

        if (
          checkTotalOk < activity.items.length - 1 &&
          !values.check[activity.id]["0"] &&
          activity.touched
        ) {
          activityLabels[index].error = true;
        } else activity.error = false;

        return 0;
      });

      if (countCheckNotOk === countTotalLabelsNotOk || totalCheck === 0)
        setNone(true);
      else setNone(false);

      if (
        countTotalLabelsOk - totalCheck !== totalNotCheck ||
        countCheckNotOk === countTotalLabelsNotOk
      )
        setIsValid(false);
      else setIsValid(true);
    }
  };
  console.log("prrrroooppss> ", props)

  return !Boolean(initial_values) || activityLabels.length === 0 ? (
    <></>
  ) : (
    <Formik
      initialValues={initial_values}
      validationSchema={null}
      onSubmit={submition}
    >
      {({ handleSubmit, setFieldValue, values, isSubmitting }) => {
        getValidation(values);

        <Risks risks={itemRisk}/>
        const submitFunc = (event: any) => {
          event?.preventDefault();
          console.log("evente >>", event)

          if (isValid) {
            handleSubmit();
          }
          // else setSubmit(true)
        };

        let propsAction: any = { ...props, itemRisk };
        console.log("propsAction >>", propsAction)
        propsAction.handleSubmit = submitFunc;
        console.log("propsAction2 >>", propsAction)
        propsAction.preSubmit = () => {
          if (none) {
            setItemRisk(2);
            handleSubmit();
          }
        };

        return (
          <form onSubmit={submitFunc}>
            <Grid container spacing={1} style={{ paddingBottom: 40 }}>
              <Grid item md={12}>
                <TitleContent>Checklist - Atividades Específicas</TitleContent>
              </Grid>

              {activityLabels.map((activity: any, index: number) => {
                return (
                  <Grid item sm={12} md={12} key={activity.id}>
                    <Accordion
                      square
                      expanded={activity.expanded || activity.error}
                      onChange={() => {
                        let activityLabelsAux = activityLabels;
                        activityLabelsAux[index].expanded = !activity.expanded;
                        setActivityLabels([...activityLabelsAux]);
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <Tooltip title="expandir">
                            <ExpandMoreIcon />
                          </Tooltip>
                        }
                        aria-controls="panel1d-content"
                      >
                        <TitleModal>{activity.name}</TitleModal>
                        {values?.count[activity.id] ===
                          activity.items.length - 1 && <DoneIconStyled />}
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container direction="column">
                          <Grid container item alignItems="center">
                            <FormControl error={activity.error}>
                              <FormGroup>
                                {activity.items
                                  .filter((_: any) => _.id !== "0")
                                  .map((item: any, i: number) => (
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      key={i}
                                    >
                                      <CheckBox
                                        id={`check.${activity.id}.${item.id}`}
                                        disabled={
                                          values.check[activity.id]["0"]
                                        }
                                        checked={
                                          values.check[activity.id][item.id]
                                        }
                                        onChange={(event) => {
                                          setFieldValue(
                                            `check.${activity.id}.${item.id}`,
                                            event.target.checked
                                          );

                                          let activityLabelsAux =
                                            activityLabels;
                                          activityLabelsAux[index].touched =
                                            true;
                                          setActivityLabels([
                                            ...activityLabelsAux,
                                          ]);

                                          if (event.target.checked) {
                                            setFieldValue(
                                              `count.${activity.id}`,
                                              (values.count[activity.id] += 1)
                                            );
                                          } else {
                                            setFieldValue(
                                              `count.${activity.id}`,
                                              (values.count[activity.id] -= 1)
                                            );
                                          }
                                        }}
                                      />
                                      <SubTitleContent>
                                        {item.name}
                                      </SubTitleContent>
                                    </Box>
                                  ))}
                                <Box display="flex" alignItems="center">
                                  <CheckBox
                                    id={`check.${activity.id}.0`}
                                    disabled={getBoolean(
                                      Object.entries(values.check[activity.id])
                                    )}
                                    checked={values.check[activity.id]["0"]}
                                    onChange={(event) => {
                                      let activityLabelsAux = activityLabels;
                                      activityLabelsAux[index].touched = true;
                                      setActivityLabels([...activityLabelsAux]);

                                      setFieldValue(
                                        `check.${activity.id}.0`,
                                        event.target.checked
                                      );

                                      if (event.target.checked) {
                                        setFieldValue(
                                          `count.${activity.id}`,
                                          values.count[activity.id] + 1
                                        );
                                      } else {
                                        setFieldValue(
                                          `count.${activity.id}`,
                                          values.count[activity.id] - 1
                                        );
                                      }
                                    }}
                                  />
                                  <SubTitleContent>
                                    {
                                      activity.items[activity.items.length - 1]
                                        .name
                                    }
                                  </SubTitleContent>
                                </Box>
                                {activity.touched && activity.error && (
                                  <h3
                                    style={{
                                      color: "red",
                                      fontWeight: "normal",
                                    }}
                                  >
                                    Preencha todos os itens.
                                  </h3>
                                )}
                              </FormGroup>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                );
              })}
              {/* {none && submit && <h3 style={{ color: "red", fontWeight: "normal", marginLeft: "0.5rem", marginTop: "0.5rem" }}>Selecione pelo menos 1 atividade.</h3>} */}

              <Action {...{ ...propsAction, isSubmitting, itemRisk,  }} />
            </Grid>
          </form>
        );
      }}
    </Formik>
  );
};

export default Activities;
